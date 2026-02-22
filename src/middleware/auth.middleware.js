// ===============================
// Import Required Modules
// ===============================
const tokenBlacklistModel = require("../models/blacklist.model");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

// ===============================
// NORMAL USER AUTH MIDDLEWARE
// ===============================
// Purpose:
// - Authenticate regular users
// - Validate JWT
// - Attach user object to req
async function authMiddleware(req, res, next) {
    // ---------------------------
    // Extract Token
    // ---------------------------
    // Priority:
    // 1. Cookie (httpOnly auth)
    // 2. Authorization header (Bearer <token>)
    const token =
        req.cookies.token || req.headers.authorization?.split(" ")[1];

    // ---------------------------
    // Token Presence Check
    // ---------------------------
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing",
        });
    }

    try {
        // ---------------------------
        // Verify JWT Signature & Expiry
        // ---------------------------
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ---------------------------
        // Fetch User from Database
        // ---------------------------
        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found",
            });
        }

        // ---------------------------
        // Attach User to Request
        // ---------------------------
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
        });
    }
}

// ===============================
// SYSTEM USER AUTH MIDDLEWARE
// ===============================
// Purpose:
// - Authenticate system/admin users
// - Validate JWT
// - Enforce systemUser role
// - Reject blacklisted tokens
async function authSystemUserMiddleware(req, res, next) {
    // ---------------------------
    // Extract Token
    // ---------------------------
    const token =
        req.cookies.token || req.headers.authorization?.split(" ")[1];

    // ---------------------------
    // Token Presence Check
    // ---------------------------
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing",
        });
    }

    // ---------------------------
    // Token Blacklist Check
    // ---------------------------
    // Prevents usage of logged-out / revoked tokens
    const isBlacklisted = await tokenBlacklistModel.findOne({ token });

    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
        });
    }

    try {
        // ---------------------------
        // Verify JWT
        // ---------------------------
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ---------------------------
        // Fetch User with systemUser Flag
        // ---------------------------
        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user not found",
            });
        }

        // ---------------------------
        // System User Authorization
        // ---------------------------
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden user, not a system user",
            });
        }

        // ---------------------------
        // Attach User to Request
        // ---------------------------
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid",
        });
    }
}

// ===============================
// Export Middlewares
// ===============================
module.exports = {
    authMiddleware,
    authSystemUserMiddleware,
};