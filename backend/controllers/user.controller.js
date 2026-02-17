const User = require("../models/user.models");
const { sendPasswordOTP } = require("../utils/sendingMail.utils");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const jwksClient = require("jwks-rsa");

// Register user controller
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      status: false,
      message: "All fields are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: false,
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    const verificationTokenExpiry = Date.now() + 10 * 60 * 1000;

    const user = await User.create({
      name,
      email,
      password,
      verificationTokenExpiry: verificationTokenExpiry,
    });

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User registration failed",
      });
    }

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
      message: error.message,
    });
  }
};

// Login user controller
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: "All fields are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    };

    res.cookie("jwtToken", jwtToken, cookieOptions);

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
      message: error.message,
    });
  }
};

// get user profile controller
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not found",
      });
    }

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

// request password reset OTP (authenticated)
const requestPasswordOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
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

// verify OTP and change password (authenticated)
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
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
      });
    }

    res.cookie("jwtToken", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

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

// ─── Forgot Password (unauthenticated flow) ─────────────────────────────────

const requestForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ status: false, message: "No account found with that email" });
    if (!user.password && user.googleId) {
      return res.status(400).json({ status: false, message: "This account uses Google Sign-In. Please use 'Sign in with Google'." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const sent = await sendPasswordOTP(user.email, otp);
    if (sent !== true && sent?.ok === false) {
      return res.status(500).json({ status: false, message: "Failed to send verification code" });
    }

    return res.status(200).json({ status: true, message: "Verification code sent to your email." });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

const resetForgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ status: false, message: "Email, verification code, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    if (user.passwordResetOTP !== otp || user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ status: false, message: "Invalid or expired verification code" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: false, message: "Password must be at least 6 characters long" });
    }

    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ status: true, message: "Password reset successfully. Please login." });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
};

// ─── Google OAuth (OpenID Connect) ───────────────────────────────────────────

const generateState = () => crypto.randomBytes(32).toString("hex");
const generateNonce = () => crypto.randomBytes(32).toString("hex");

const getJwksClient = () => {
  return jwksClient({
    jwksUri: process.env.GOOGLE_JWKS_URL || "https://www.googleapis.com/oauth2/v3/certs",
    cache: true,
    rateLimit: true,
  });
};

const getSigningKey = async (kid) => {
  const client = getJwksClient();
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
};

const verifyGoogleToken = async (token) => {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) throw new Error("Invalid token");
  const signingKey = await getSigningKey(decoded.header.kid);
  return jwt.verify(token, signingKey, {
    algorithms: ["RS256"],
    audience: process.env.GOOGLE_CLIENT_ID,
  });
};

const googleLogin = (req, res) => {
  const state = generateState();
  const nonce = generateNonce();

  const isSecure = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
  const cookieOpts = {
    httpOnly: true,
    maxAge: 600000,
    sameSite: "lax",
    secure: isSecure,
  };
  res.cookie("oauth_state", state, cookieOpts);
  res.cookie("oauth_nonce", nonce, cookieOpts);

  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=email%20profile%20openid` +
    `&state=${state}` +
    `&nonce=${nonce}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(googleAuthUrl);
};

const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies.oauth_state;
    const savedNonce = req.cookies.oauth_nonce;

    res.clearCookie("oauth_state");
    res.clearCookie("oauth_nonce");

    if (!state || !savedState || state !== savedState) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          code,
          grant_type: "authorization_code",
        },
      }
    );

    const { id_token } = tokenResponse.data;
    if (!id_token) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    const decodedToken = await verifyGoogleToken(id_token);
    if (!decodedToken || !decodedToken.nonce || decodedToken.nonce !== savedNonce) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    // Find or create user
    let user = await User.findOne({ googleId: decodedToken.sub });
    if (!user) {
      user = await User.findOne({ email: decodedToken.email });
      if (user) {
        user.googleId = decodedToken.sub;
        if (!user.profilePic && decodedToken.picture) user.profilePic = decodedToken.picture;
        await user.save();
      } else {
        user = await User.create({
          googleId: decodedToken.sub,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split("@")[0],
          profilePic: decodedToken.picture || "",
        });
      }
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || "24h",
    });

    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };
    res.cookie("jwtToken", jwtToken, cookieOptions);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/auth/google/callback?token=${jwtToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&id=${user._id}`
    );
  } catch (error) {
    console.error("Google OAuth Callback Error:", error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

module.exports = {
  registerUser,
  login,
  getProfile,
  logout,
  updateProfile,
  requestPasswordOTP,
  verifyPasswordOTP,
  googleLogin,
  googleCallback,
  requestForgotPassword,
  resetForgotPassword,
};
