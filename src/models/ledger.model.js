// ===============================
// Import Mongoose
// ===============================
const mongoose = require("mongoose")

// ===============================
// Ledger Schema Definition
// ===============================
// Ledger represents an immutable accounting record
// Each transaction creates CREDIT & DEBIT ledger entries
const ledgerSchema = new mongoose.Schema({
  
  // ---------------------------
  // Associated Account
  // ---------------------------
  // Account affected by this ledger entry
  // immutable → cannot be changed after creation
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Ledger must be associated with an account"],
    index: true,
    immutable: true,
  },

  // ---------------------------
  // Ledger Amount
  // ---------------------------
  // Positive numeric value
  // CREDIT → increases balance
  // DEBIT  → decreases balance
  amount: {
    type: Number,
    required: [true, "Amount is required for creating a ledger entry"],
    immutable: true,
  },

  // ---------------------------
  // Related Transaction
  // ---------------------------
  // Connects ledger entry to transaction record
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transaction",
    required: [true, "Ledger must be associated with a transaction"],
    index: true,
    immutable: true,
  },

  // ---------------------------
  // Ledger Entry Type
  // ---------------------------
  // CREDIT → money added to account
  // DEBIT  → money deducted from account
  type: {
    type: String,
    enum: {
      values: ["CREDIT", "DEBIT"],
      message: "Type can be either CREDIT or DEBIT",
    },
    required: [true, "Ledger type is required"],
    immutable: true,
  },
})

// ===============================
// Prevent Ledger Modification
// ===============================
// Ledger entries are append-only records
// Any attempt to update or delete will throw an error
function preventLedgerModification() {
  throw new Error(
    "Ledger entries are immutable and can not be modified or deleted"
  )
}

// ===============================
// Block All Mutating Operations
// ===============================
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification)
ledgerSchema.pre("updateOne", preventLedgerModification)
ledgerSchema.pre("updateMany", preventLedgerModification)
ledgerSchema.pre("deleteOne", preventLedgerModification)
ledgerSchema.pre("deleteMany", preventLedgerModification)
ledgerSchema.pre("remove", preventLedgerModification)
ledgerSchema.pre("findOneAndDelete", preventLedgerModification)
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)

// ===============================
// Create & Export Ledger Model
// ===============================
const ledgerModel = mongoose.model("ledger", ledgerSchema)

module.exports = ledgerModel