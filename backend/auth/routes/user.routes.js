const express = require("express");
const {
  getProfile,
  login,
  logout,
  registerUser,
  updateProfile,
  googleLogin,
  googleCallback
} = require("../controllers/user.controller");
const isLoggedIn = require("../middlewares/isLoggedIn.middleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/get-profile", isLoggedIn, getProfile);
router.put("/update-profile", isLoggedIn, updateProfile);
router.post("/logout", isLoggedIn, logout);

// Google OAuth
router.get("/google/login", googleLogin);
router.get("/google/callback", googleCallback);

module.exports = router;
