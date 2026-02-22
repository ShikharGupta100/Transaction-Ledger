// ===============================
// Import Mongoose
// ===============================
const mongoose = require("mongoose")

// ===============================
// Token Blacklist Schema Definition
// ===============================
// Stores invalidated JWTs after logout
// Prevents reuse of tokens until natural expiration
const tokenBlacklistSchema = new mongoose.Schema(
  {
    // ---------------------------
    // Blacklisted JWT Token
    // ---------------------------
    // Stores the raw JWT string
    // unique → prevents duplicate blacklist entries
    token: {
      type: String,
      required: [true, "Token is required to blacklist"],
      unique: [true, "Token is already blacklisted"],
    },
  },
  {
    // Adds createdAt & updatedAt timestamps
    timestamps: true,
  }
)

// ===============================
// TTL Index (Auto Cleanup)
// ===============================
// Automatically deletes blacklisted tokens
// after 3 days (matching JWT expiry duration)
tokenBlacklistSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 3, // 3 days
  }
)

// ===============================
// Create & Export Token Blacklist Model
// ===============================
const tokenBlacklistModel = mongoose.model(
  "tokenBlacklist",
  tokenBlacklistSchema
)

module.exports = tokenBlacklistModel