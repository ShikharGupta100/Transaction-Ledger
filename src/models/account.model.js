// ===============================
// Import Required Modules
// ===============================
const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")

// ===============================
// Account Schema Definition
// ===============================
// Represents a user-owned financial account
// Balance is NOT stored directly (derived from ledger)
const accountSchema = new mongoose.Schema(
  {
    // ---------------------------
    // Account Owner
    // ---------------------------
    // Reference to user who owns this account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with a user"],
      index: true,
    },

    // ---------------------------
    // Account Status
    // ---------------------------
    // ACTIVE  → normal operations allowed
    // FROZEN  → no debit/credit allowed
    // CLOSED  → permanently disabled
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN or CLOSED",
      },
      default: "ACTIVE",
    },

    // ---------------------------
    // Account Currency
    // ---------------------------
    // Default currency set to INR
    currency: {
      type: String,
      default: "INR",
      required: [true, "Currency is required for creating a account"],
    },
  },
  {
    // Automatically adds createdAt & updatedAt fields
    timestamps: true,
  }
)

// ===============================
// Compound Index
// ===============================
// Optimizes queries fetching user accounts by status
accountSchema.index({ user: 1, status: 1 })

// ===============================
// Instance Method: Get Account Balance
// ===============================
// Calculates balance using ledger aggregation
// Formula: total CREDIT − total DEBIT
accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    // Match ledger entries for this account
    { $match: { account: this._id } },

    // Group debit and credit totals
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
          },
        },
      },
    },

    // Calculate final balance
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ])

  // If no ledger entries exist, balance is zero
  if (balanceData.length === 0) {
    return 0
  }

  return balanceData[0].balance
}

// ===============================
// Create & Export Account Model
// ===============================
const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel