// ===============================
// Import Required Modules
// ===============================
const express = require("express")
const authController = require("../controllers/auth.controller")

// ===============================
// Initialize Express Router
// ===============================
const router = express.Router()

// ===============================
// USER REGISTRATION ROUTE
// ===============================
// Endpoint: POST /api/auth/register
// Purpose: Create a new user account
// Handles:
// - Input validation
// - Password hashing
// - User persistence in database
router.post("/register", authController.userRegisterController)

// ===============================
// USER LOGIN ROUTE
// ===============================
// Endpoint: POST /api/auth/login
// Purpose: Authenticate user and issue JWT
// Handles:
// - Credential verification
// - Token generation
// - Cookie or response token setup
router.post("/login", authController.userLoginController)

// ===============================
// USER LOGOUT ROUTE
// ===============================
// Endpoint: POST /api/auth/logout
// Purpose: Invalidate user session / token
// Handles:
// - Clearing authentication cookies
// - Token invalidation (if implemented)
router.post("/logout", authController.userLogoutController)

// ===============================
// Export Auth Router
// ===============================
module.exports = router