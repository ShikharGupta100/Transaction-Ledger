const mongoose = require("mongoose")


const transactionSchema = new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Trasaction must be associated with a from account"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Trasaction must be associated with a to account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","FAILED","REVERTED","COMPLETED"],
            message:["Status can be either of PENDING , COMPLETED, FAILED or REVERSED"]
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a transaction"],
        min:[0,"Transaction can not be negative"]
    },
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required for creating a transaction"],
        index:true,
        unique:true
    }
},{
    timestamps:true
})

const transactionModel = mongoose.model("transaction",transactionSchema)

module.exports = transactionModel