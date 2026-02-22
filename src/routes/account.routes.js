// ===============================
// Import Required Modules
// ===============================
const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController  = require("../controllers/account.controller")

// ===============================
// Initialize Express Router
// ===============================
const router = express.Router()

// ===============================
// CREATE NEW ACCOUNT
// ===============================
// Endpoint: POST /api/accounts
// Access: Authenticated users only
// Purpose:
// - Create a new ledger account for logged-in user
// - Associate account with req.user
router.post(
  "/",
  authMiddleware.authMiddleware,
  accountController.createAccountController
)

// ===============================
// GET USER ACCOUNTS
// ===============================
// Endpoint: GET /api/accounts
// Access: Authenticated users only
// Purpose:
// - Fetch all accounts belonging to logged-in user
router.get(
  "/",
  authMiddleware.authMiddleware,
  accountController.getUserAccountController
)

// ===============================
// GET ACCOUNT BALANCE
// ===============================
// Endpoint: GET /api/accounts/balance/:accountId
// Access: Authenticated users only
// Purpose:
// - Retrieve current balance of a specific account
// - Validates account ownership
router.get(
  "/balance/:accountId",
  authMiddleware.authMiddleware,
  accountController.getAccountBalanceController
)

// ===============================
// Export Account Router
// ===============================
module.exports = router