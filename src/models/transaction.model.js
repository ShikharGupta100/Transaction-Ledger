// ===============================
// Import Mongoose
// ===============================
const mongoose = require("mongoose")

// ===============================
// Transaction Schema Definition
// ===============================
const transactionSchema = new mongoose.Schema(
  {
    // ---------------------------
    // Source Account (Debit)
    // ---------------------------
    // Account from which amount is deducted
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Trasaction must be associated with a from account"],
      index: true,
    },

    // ---------------------------
    // Destination Account (Credit)
    // ---------------------------
    // Account to which amount is credited
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Trasaction must be associated with a to account"],
      index: true,
    },

    // ---------------------------
    // Transaction Status
    // ---------------------------
    // PENDING   → transaction created, not finalized
    // COMPLETED → transaction successfully processed
    // FAILED    → transaction failed due to error
    // REVERTED  → transaction rolled back
    status: {
      type: String,
      enum: {
        values: ["PENDING", "FAILED", "REVERTED", "COMPLETED"],
        message: [
          "Status can be either of PENDING, COMPLETED, FAILED or REVERSED",
        ],
      },
      default: "PENDING",
    },

    // ---------------------------
    // Transaction Amount
    // ---------------------------
    // Amount being transferred
    amount: {
      type: Number,
      required: [true, "Amount is required for creating a transaction"],
      min: [0, "Transaction can not be negative"],
    },

    // ---------------------------
    // Idempotency Key
    // ---------------------------
    // Prevents duplicate transactions on retries
    // Ensures same request is processed only once
    idempotencyKey: {
      type: String,
      required: [
        true,
        "Idempotency key is required for creating a transaction",
      ],
      index: true,
      unique: true,
    },
  },
  {
    // Automatically manages createdAt & updatedAt fields
    timestamps: true,
  }
)

// ===============================
// Create & Export Transaction Model
// ===============================
const transactionModel = mongoose.model("transaction", transactionSchema)

module.exports = transactionModel