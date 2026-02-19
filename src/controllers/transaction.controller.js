const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService =require("../services/email.service");
const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");
const mongoose = require("mongoose");



async function createTransaction(req,res) {
    const {fromAccount, toAccount,amount,idempotencyKey} = req.body


    /**
     * -Validate request
     */


    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"fromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await userModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await userModel.findOne({
        _id:toAccount,
    })
    
    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }


/**
 * - Validate Idempotency Key
 */


const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey:idempotencyKey
})

if(isTransactionAlreadyExists){
    if(isTransactionAlreadyExists.status === "COMPLETED"){
        return res.status(200).json({
            message:"Transaction already processed",
            transaction:isTransactionAlreadyExists
        })
    }

    if(isTransactionAlreadyExists.status === "PENDING"){
        return res.status(200).json({
            message:"Transaction is still processing",
        })
    }

    if(isTransactionAlreadyExists.status === "FAILED"){
        return res.status(500).json({
            message:"Transaction process failed, please retry"
        })
    }

    if(isTransactionAlreadyExists.status === "REVERTED"){
        return res.status(500).json({
            message:"Transaction was reversed, please retry"
        })
    }
}
/***
 * - Check Active status
 */
    if(toUserAccount.status !== "ACTIVE" || fromUserAccount !== "ACTIVE"){
        return res.status(400).json({
            message:"Both fromUserAccount and toUserccount must be active to process transaction"
        })
    }

    /**
     * - Derive sender balance from ledger
     */

    const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        return res.status(400).json({
            message:`Insufficient balance. Current balance is ${balance}.
            Request amount is ${amount}`
        })
    }

    /**
     * Create transaction (PENDING)
     *  Create DEBIT ledger entry
     *  Create CREDIT ledger entry
     *  Mark transaction COMPLETED
     *  Commit MongoDB session
     */

    const session = await mongoose.startSession()
    session.startTransaction()


    transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        idempotencyKey,
        amount,
        status:"PENDING",
    }],{session}))[0]


    const debitledgerEntry = await ledgerModel.create([{
        account:fromAccount,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    }],{session})


    const creditledgerEntry = await ledgerModel.create([{
        account:toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    }],{session})


    transaction.status = "COMPLETED"
    await transaction.save({session})


    await session.commitTransaction()
    session.endSession()

    /**
     * - Send email service
     */

    await emailService.sendTransactionEmail(req.user.name,req.user.email,amount,toAccount)
    return res.status(201).json({
        message:"Transaction completed successfully",
        transaction:transaction
    })


}

async function createInitialFundsTransaction(req,res) {
    const {toAccount,amount,idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"toAccount, amount and idempotency key are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!toUserAccount){
        return res.status(400).json({
            message:"Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user:req.user._id
    })

    if(!fromUserAccount){
        return res.status(400).json({
            message:"System user account has not found"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
    
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}