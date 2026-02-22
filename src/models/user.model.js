// ===============================
// Import Required Libraries
// ===============================
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// ===============================
// User Schema Definition
// ===============================
const userSchema = new mongoose.Schema(
  {
    // ---------------------------
    // User Email
    // ---------------------------
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required for creating a user"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      unique: [true, "Email already exists."],
    },

    // ---------------------------
    // User Name
    // ---------------------------
    name: {
      type: String,
      required: [true, "Name is required for creating an account"],
    },

    // ---------------------------
    // User Password
    // ---------------------------
    // select:false → password will NOT be returned in queries by default
    password: {
      type: String,
      required: [true, "Password is required for creating an account"],
      minlength: [6, "password should contain more than 6 character"],
      select: false,
    },

    // ---------------------------
    // System User Flag
    // ---------------------------
    // Used to identify system/admin users
    // immutable → cannot be changed once created
    // select:false → hidden from query results
    systemUser: {
      type: Boolean,
      immutable: true,
      select: false,
      default: false,
    },
  },
  {
    // Automatically adds createdAt & updatedAt fields
    timestamps: true,
  }
)

// ===============================
// Pre-save Hook (Password Hashing)
// ===============================
// Hashes password before saving user to database
// Runs only if password field is modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return
  }

  const hash = await bcrypt.hash(this.password, 10)
  this.password = hash

  return
})

// ===============================
// Instance Method: Compare Password
// ===============================
// Used during login to verify user credentials
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

// ===============================
// Create & Export User Model
// ===============================
const userModel = mongoose.model("user", userSchema)

module.exports = userModel