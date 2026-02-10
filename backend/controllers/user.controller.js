const User = require("../models/user.models");
const { sendPasswordOTP } = require("../utils/sendingMail.utils");
const jwt = require("jsonwebtoken");

// Register user controller
const registerUser = async (req, res) => {
  // 1. Get user data from request body
  const { name, email, password } = req.body;

  // 2. validate the inputs
  if (!email || !name || !password) {
    return res.status(400).json({
      status: false,
      message: "All fields are required",
    });
  }

  // password validation
  if (password.length < 6) {
    return res.status(400).json({
      status: false,
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    // 3. Check if user already exists in DB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    // 4. hashing of password is done in the User model using pre-save hook middleware

    // 5. generate a verification token and expiry time
    const verificationTokenExpiry = Date.now() + 10 * 60 * 1000;

    // 6. now create a new user
    const user = await User.create({
      name,
      email,
      password,
      verificationTokenExpiry: verificationTokenExpiry,
    });

    // 6. check if user is created
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User registration failed",
      });
    }
    

    // 7. verify the user email address by sending a token to the user's email address
    // await sendVerificationEmail(user.email, user.verificationToken);

    // 8. send response
    return res.status(201).json({
      status: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("User registration failed", error);
    return res.status(500).json({
      status: false,
      message: error.message // "User registration failed",
      
    });
  }
};

// Login user controller
const login = async (req, res) => {
  // 1. get user data from request body
  const { email, password } = req.body;

  // 2. validate the inputs
  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: "All fields are required",
    });
  }

  try {
    // 3. check if user exists in DB with the provided email
    const user = await User.findOne({ email });

    // 4. check if user exists
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // 6. compare the password
    const isPasswordMatch = await user.comparePassword(password);

    // 7. check if password is correct
    if (!isPasswordMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // 8. create a JWT token for the user to access protected routes
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    // 9. set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    };

    res.cookie("jwtToken", jwtToken, cookieOptions);

    // 10. send response with token in body as fallback for cross-origin issues
    return res.status(200).json({
      status: true,
      message: "User logged in successfully",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("User login failed", error);
    return res.status(500).json({
      status: false,
      message: error.message,  // Show actual error message
      stack: error.stack        // Show stack trace
    });
  }
};

// get user profile controller
const getProfile = async (req, res) => {
  try {
    // 1. get user id from request object
    const userId = req.user.id;

    // 2. find user by id
    const user = await User.findById(userId).select("-password");

    // check if user exists
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }

    // 3. send response
    return res.status(200).json({
      status: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
        socialLinks: user.socialLinks,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error getting user profile", error);
    return res.status(500).json({
      status: false,
      message: "Error getting user profile",
    });
  }
};

// update user profile controller
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phoneCountryCode, phoneNumber, socialLinks, profilePic } = req.body;

    const user = await User.findByIdAndUpdate(userId, {
      name,
      phoneCountryCode,
      phoneNumber,
      socialLinks,
      profilePic
    }, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneCountryCode: user.phoneCountryCode,
        phoneNumber: user.phoneNumber,
        socialLinks: user.socialLinks,
        profilePic: user.profilePic,
      }
    });
  } catch (err) {
    console.error("Update profile error", err);
    return res.status(500).json({ status: false, message: err.message });
  }
};

// request password reset OTP
const requestPasswordOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    // Generate 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const sent = await sendPasswordOTP(user.email, otp);
    if (sent !== true && sent?.ok === false) {
      return res.status(500).json({ status: false, message: "Failed to send verification code", detail: sent.error });
    }

    return res.status(200).json({
      status: true,
      message: "Verification code sent to your email."
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// verify OTP and change password
const verifyPasswordOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    if (user.passwordResetOTP !== otp || user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ status: false, message: "Invalid or expired code" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ status: false, message: "Password must be at least 6 characters long" });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ status: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// logout user controller
const logout = async (req, res) => {
  try {
    // 1. check if user is logged in
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
      });
    }

    // 2. clear cookie
    res.cookie("jwtToken", "", {
      expires: new Date(Date.now()), // set the cookie to expire immediately after logout
      httpOnly: true,
    });

    // 3. send response
    return res.status(200).json({
      status: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("User logout failed", error);
    return res.status(500).json({
      status: false,
      message: "User logout failed",
    });
  }
};

module.exports = { registerUser, login, getProfile, logout, updateProfile, requestPasswordOTP, verifyPasswordOTP };
