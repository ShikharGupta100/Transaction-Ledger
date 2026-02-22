// ===============================
// Import Required Modules
// ===============================
const { Router } = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

// ===============================
// Initialize Express Router
// ===============================
const router = Router();

// ===============================
// USER → ACCOUNT TRANSFER ROUTE
// ===============================
// Endpoint: POST /api/transactions/
// Access: Authenticated users only
// Purpose: Transfer money between user accounts
// Middleware Flow:
// 1. authMiddleware → verifies JWT & attaches user to req
// 2. createTransaction → validates accounts & performs transfer
router.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction
);

// ===============================
// SYSTEM → INITIAL FUNDING ROUTE
// ===============================
// Endpoint: POST /api/transactions/system/initial-funds
// Access: System user only (admin / internal service)
// Purpose: Seed initial funds into the system ledger
// Middleware Flow:
// 1. authSystemUserMiddleware → ensures system-level access
// 2. createInitialFundsTransaction → creates system credit entry
router.post(
  "/system/initial-funds",
  authMiddleware.authSystemUserMiddleware,
  transactionController.createInitialFundsTransaction
);

// ===============================
// Export Router
// ===============================
module.exports = router;