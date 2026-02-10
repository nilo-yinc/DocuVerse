const express = require("express");
const {
  getProfile,
  login,
  logout,
  registerUser,
  updateProfile,
  requestPasswordOTP,
  verifyPasswordOTP
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

module.exports = router;
