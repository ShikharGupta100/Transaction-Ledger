const accountModel = require("../models/account.model")

/**
 * ============================
 * CREATE ACCOUNT CONTROLLER
 * ============================
 * - Creates a new account for the authenticated user
 * - Ensures one account per user
 */
async function createAccountController(req,res) {

    // 🔐 Authenticated user (set by auth middleware)
    const user = req.user;

    // ❗ DUPLICATE ACCOUNT CHECK
    // Prevents creating more than one account per user
    const existingAccount = await accountModel.findOne({ user: user._id });

    if (existingAccount) {
        return res.status(400).json({
            message: "Account already exists for this user",
            account: existingAccount,
        });
    }

    // 🆕 ACCOUNT CREATION
    // Only user reference is required, balance handled internally
    const account = await accountModel.create({
        user:user._id
    })

    // ✅ SUCCESS RESPONSE
    return res.status(201).json({
        account
    })
}

/**
 * ============================
 * GET USER ACCOUNTS CONTROLLER
 * ============================
 * - Fetches all accounts belonging to logged-in user
 */
async function getUserAccountController(req,res){

    // 🔍 Fetch accounts owned by authenticated user
    const accounts = await accountModel.find({user:req.user._id})

    // ✅ SUCCESS RESPONSE
    res.status(200).json({
        accounts
    })
}

/**
 * ============================
 * GET ACCOUNT BALANCE CONTROLLER
 * ============================
 * - Returns balance for a specific account
 * - Ensures account ownership
 */
async function getAccountBalanceController(req,res) {

    // 📥 Extract accountId from route params
    const {accountId} = req.params;

    // 🔐 OWNERSHIP CHECK
    // Ensures user can only access their own account
    const account = await accountModel.findOne({
        _id:accountId,
        user:req.user._id
    })

    // ❌ Account not found or unauthorized access
    if(!account){
        return res.status(404).json({
            message:"Account not found"
        })
    }

    // 💰 BALANCE CALCULATION
    // Delegated to model method (business logic)
    const balance = await account.getBalance();

    // ✅ SUCCESS RESPONSE
    res.status(200).json({
        accountId:account._id,
        balance:balance
    })
}

module.exports = {
    createAccountController,
    getUserAccountController,
    getAccountBalanceController
}