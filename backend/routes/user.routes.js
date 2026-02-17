const express = require("express");
const {
  getProfile,
  login,
  logout,
  registerUser,
  updateProfile,
  requestPasswordOTP,
  verifyPasswordOTP,
  googleLogin,
  googleCallback,
  requestForgotPassword,
  resetForgotPassword
} = require("../controllers/user.controller");
const isLoggedIn = require("../middlewares/isLoggedIn.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/get-profile", isLoggedIn, getProfile);
router.post("/logout", isLoggedIn, logout);
router.put("/update-profile", isLoggedIn, updateProfile);
router.post("/request-password-otp", isLoggedIn, requestPasswordOTP);
router.post("/verify-password-otp", isLoggedIn, verifyPasswordOTP);

// Google OAuth routes
router.get("/google/login", googleLogin);
router.get("/google/callback", googleCallback);

// Forgot Password (unauthenticated)
router.post("/forgot-password", requestForgotPassword);
router.post("/reset-password", resetForgotPassword);

module.exports = router;
