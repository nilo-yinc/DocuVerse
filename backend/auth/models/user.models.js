const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      // NOT required — Google OAuth users won't have a password
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values (non-Google users)
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  // Skip if no password or password not modified
  if (!this.password || !this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false; // Google-only users have no password
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
