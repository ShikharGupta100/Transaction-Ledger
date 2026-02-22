// ===============================
// Import Required Modules
// ===============================
const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlacklistModel = require("../models/blacklist.model")

/* ===============================
   USER REGISTRATION CONTROLLER
   =============================== */
/**
 * Endpoint: POST /api/auth/register
 * Purpose:
 * - Create a new user
 * - Hash password (via model pre-save hook)
 * - Issue JWT token
 * - Send welcome/registration email
 */
async function userRegisterController(req, res) {
    try {
        // ---------------------------
        // Extract Request Body
        // ---------------------------
        const { email, password, name } = req.body || {}

        // ---------------------------
        // Check if User Already Exists
        // ---------------------------
        const isExists = await userModel.findOne({ email })

        if (isExists) {
            return res.status(422).json({
                message: "User already exits with an email",
                status: "failed",
            })
        }

        // ---------------------------
        // Create New User
        // ---------------------------
        const user = await userModel.create({
            email,
            password,
            name,
        })

        // ---------------------------
        // Generate JWT Token
        // ---------------------------
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "3d" }
        )

        // ---------------------------
        // Set Token in Cookie
        // ---------------------------
        res.cookie("token", token)

        // ---------------------------
        // Send Registration Email
        // ---------------------------
        await emailService.sendRegistrationEmail(user.email, user.name)

        // ---------------------------
        // Send Response
        // ---------------------------
        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
            token,
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message,
        })
    }
}

/* ===============================
   USER LOGIN CONTROLLER
   =============================== */
/**
 * Endpoint: POST /api/auth/login
 * Purpose:
 * - Authenticate user credentials
 * - Issue JWT token
 * - Set token in cookie
 */
async function userLoginController(req, res) {
    const { email, password } = req.body || {}

    // ---------------------------
    // Input Validation
    // ---------------------------
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required",
        })
    }

    // ---------------------------
    // Fetch User with Password
    // ---------------------------
    const user = await userModel
        .findOne({ email })
        .select("+password")

    if (!user) {
        return res.status(401).json({
            message: "Email or password is invalid",
        })
    }

    // ---------------------------
    // Verify Password
    // ---------------------------
    const isValidPassword = await user.comparePassword(password)

    if (!isValidPassword) {
        return res.status(401).json({
            message: "Password is Invalid",
        })
    }

    // ---------------------------
    // Generate JWT Token
    // ---------------------------
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "3d" }
    )

    // ---------------------------
    // Set Token in Cookie
    // ---------------------------
    res.cookie("token", token)

    // ---------------------------
    // Send Response
    // ---------------------------
    return res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
        },
        token,
    })
}

/* ===============================
   USER LOGOUT CONTROLLER
   =============================== */
/**
 * Endpoint: POST /api/auth/logout
 * Purpose:
 * - Invalidate JWT using blacklist
 * - Clear auth cookie
 */
async function userLogoutController(req, res) {
    // ---------------------------
    // Extract Token
    // ---------------------------
    const token =
        req.cookies.token || req.headers.authorization?.split(" ")[1]

    // ---------------------------
    // If No Token → Already Logged Out
    // ---------------------------
    if (!token) {
        return res.status(200).json({
            message: "User Logout Successfully",
        })
    }

    // ---------------------------
    // Blacklist Token
    // ---------------------------
    await tokenBlacklistModel.create({
        token: token,
    })

    // ---------------------------
    // Clear Cookie
    // ---------------------------
    res.clearCookie("token")

    return res.status(200).json({
        message: "User Logout Successfully",
    })
}

// ===============================
// Export Controllers
// ===============================
module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
}