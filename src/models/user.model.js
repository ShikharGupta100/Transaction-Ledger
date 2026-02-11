const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = mongoose.Schema({
    email:{
        type:String,
        trim:true,
        lowercase:true,
        required:[true,"Email is required for creating a user"],
        match:[/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please enter a valid email address"],
        unique:[true,"Email already exists."]
    },
    name:{
        type:String,
        required:[true,"Name is required for creating an account"]
    },
    password:{
        type:String,
        required:[true,"Password is required for creating an account"],
        minlength:[6,"password should contain more than 6 character"],
        select:false
    },
        timestamps:true
})