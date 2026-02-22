// ===============================
// Import Required Modules
// ===============================
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");

/* ===========================
   NORMAL ACCOUNT TRANSFER
   =========================== */
// Purpose:
// - Transfer money from one user account to another
// - Uses idempotency to avoid duplicates
// - Uses MongoDB session for atomicity
async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  /* ---------------------------
     Basic Input Validation
     --------------------------- */
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencyKey are required",
    });
  }

  // Prevent self-transfer
  if (fromAccount === toAccount) {
    return res.status(400).json({
      message: "fromAccount and toAccount cannot be the same",
    });
  }

  /* ---------------------------
     Account Validation
     --------------------------- */
  const fromUserAccount = await accountModel.findById(fromAccount);
  const toUserAccount = await accountModel.findById(toAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  // Ensure both accounts are active
  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both accounts must be ACTIVE",
    });
  }

  /* ---------------------------
     Idempotency Check
     --------------------------- */
  // Prevent duplicate processing on retries
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });

  if (existingTransaction) {
    return res.status(200).json({
      message: "Transaction already processed",
      transaction: existingTransaction,
    });
  }

  /* ---------------------------
     Balance Check
     --------------------------- */
  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}`,
    });
  }

  /* ---------------------------
     MongoDB Transaction (ACID)
     --------------------------- */
  let transaction;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Create transaction record (PENDING)
      transaction = (
        await transactionModel.create(
          [
            {
              fromAccount,
              toAccount,
              amount,
              idempotencyKey,
              status: "PENDING",
            },
          ],
          { session }
        )
      )[0];

      // 2️⃣ Create DEBIT ledger entry
      await ledgerModel.create(
        [
          {
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: "DEBIT",
          },
        ],
        { session }
      );

      // ⏳ Artificial delay (simulating async processing)
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // 3️⃣ Create CREDIT ledger entry
      await ledgerModel.create(
        [
          {
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT",
          },
        ],
        { session }
      );

      // 4️⃣ Mark transaction as COMPLETED
      transaction.status = "COMPLETED";
      await transaction.save({ session });

      // ✅ Commit atomic transaction
      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      // If any step fails → transaction remains pending
      return res.status(400).json({
        message:
          "Transaction is Pending due to some issue, please retry after sometime",
      });
    }

    /* ---------------------------
       Email Notification
       --------------------------- */
    await emailService.sendTransactionEmail(
      req.user.name,
      req.user.email,
      amount,
      toAccount
    );

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction,
    });
  } catch (error) {
    // Fallback safety (should rarely hit)
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/* ===========================
   INITIAL FUNDS (SYSTEM CREDIT)
   =========================== */
// Purpose:
// - Credit money into a user account from SYSTEM
// - Used for seeding / onboarding balances
async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  /* ---------------------------
     Input Validation
     --------------------------- */
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
    });
  }

  const account = await accountModel.findById(toAccount);
  if (!account) {
    return res.status(400).json({
      message: "Invalid toAccount",
    });
  }

  /* ---------------------------
     Fetch System Account
     --------------------------- */
  const systemAccount = await accountModel.findOne({ type: "SYSTEM" });
  if (!systemAccount) {
    return res.status(500).json({
      message: "System account not configured",
    });
  }

  /* ---------------------------
     Idempotency Check
     --------------------------- */
  const existingTransaction = await transactionModel.findOne({
    idempotencyKey,
  });
  if (existingTransaction) {
    return res.status(200).json({
      message: "Initial funds already created",
      transaction: existingTransaction,
    });
  }

  /* ---------------------------
     MongoDB Transaction
     --------------------------- */
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Create system → user transaction
    const transaction = (
      await transactionModel.create(
        [
          {
            fromAccount: systemAccount._id, // SYSTEM
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session }
      )
    )[0];

    // 2️⃣ CREDIT ledger entry (money creation)
    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session }
    );

    // 3️⃣ Mark transaction as completed
    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Initial funds transaction completed successfully",
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

// ===============================
// Export Controller Functions
// ===============================
module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};