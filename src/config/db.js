const mongoose = require("mongoose")

/**
 * ============================
 * DATABASE CONNECTION FUNCTION
 * ============================
 * - Establishes connection to MongoDB using Mongoose
 * - Uses MONGO_URI from environment variables
 */
function connectToDB(){

    // 🔗 CONNECT TO MONGODB
    mongoose.connect(process.env.MONGO_URI)

    // ✅ SUCCESS HANDLER
    .then(()=>{
        console.log("Server is connected to DB");
    })

    // ❌ ERROR HANDLER
    .catch((error)=>{
        console.log("Error connecting to DB");

        // 📛 Log actual error message for debugging
        console.error(error.message);

        // ⛔ Exit process if DB connection fails
        process.exit(1);
    })
}

// 📦 Export DB connection function
module.exports = connectToDB