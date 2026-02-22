// ===============================
// Import core dependencies
// ===============================
const express = require('express')
const cookieParser = require("cookie-parser")

// ===============================
// Initialize Express application
// ===============================
const app = express()

// ===============================
// Global Middlewares
// ===============================

// Parses application/x-www-form-urlencoded data
// Used when form data is sent via POST requests
app.use(express.urlencoded({ extended: true }))

// Parses incoming JSON request bodies
// Required for REST APIs
app.use(express.json())

// Parses cookies attached to incoming requests
// Needed for JWT / session-based authentication
app.use(cookieParser())

// ===============================
// Import Route Modules
// ===============================

// Authentication routes (login, register, logout, etc.)
const authRouter = require("./routes/auth.routes")

// Account-related routes (create account, get user accounts, balance, etc.)
const accountRouter = require("./routes/account.routes")

// Transaction routes (transfers, ledger entries, system funds, etc.)
const transactionRoutes = require("./routes/transaction.routes")

// ===============================
// Health Check / Root Route
// ===============================

// Simple endpoint to verify server is running
app.get("/", (req, res) => {
    res.send("Ledger Server is up and running")
})

// ===============================
// Mount API Routes
// ===============================

// All authentication APIs → /api/auth/*
app.use("/api/auth", authRouter)

// All account-related APIs → /api/accounts/*
app.use("/api/accounts", accountRouter)

// All transaction-related APIs → /api/transactions/*
app.use("/api/transactions", transactionRoutes)

// ===============================
// Export Express App
// ===============================

// Exporting app so it can be used by server.js / index.js
module.exports = app