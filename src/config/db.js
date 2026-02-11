const mongoose=require("mongoose")

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("server is connected to DB");
    })
    .catch((error)=>{
        console.log("Error connecting to DB");
        console.error(error.message);
        process.exit(1);
    })

}
module.exports = connectToDB 