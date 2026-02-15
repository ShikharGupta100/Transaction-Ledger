const express = require("express")
const { Route } = require("react-router-dom")
const authMiddleware = require("../middleware/auth.middleware")




const router = express.Router()

/**
 * - POST /api/accounts
 * - Create a new account
 * - Protected Route
 */
router.post("/",authMiddleware.authMiddleware)



module.exports = router



