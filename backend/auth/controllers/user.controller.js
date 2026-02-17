const User = require("../models/user.models");
// const { sendVerificationEmail } = require("../utils/sendingMail.utils");
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
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic
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
      return res.status(401).json({
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
        phone: user.phone,
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

// Update user profile controller
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, profilePic, password } = req.body;
    
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePic) user.profilePic = profilePic;
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: false,
          message: "Password must be at least 6 characters long",
        });
      }
      user.password = password; // Pre-save hook will hash it
    }

    await user.save();

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Profile update failed", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Profile update failed",
    });
  }
};

// ─── Google OAuth (OpenID Connect) ───────────────────────────────────────────

const crypto = require("crypto");
const axios = require("axios");
const jwksClient = require("jwks-rsa");

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

// Step 1: Redirect user to Google consent screen
const googleLogin = (req, res) => {
  const state = generateState();
  const nonce = generateNonce();

  const cookieOpts = {
    httpOnly: true,
    maxAge: 600000,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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

// Step 2: Handle Google callback
const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies.oauth_state;
    const savedNonce = req.cookies.oauth_nonce;

    res.clearCookie("oauth_state");
    res.clearCookie("oauth_nonce");

    if (!state || !savedState || state !== savedState) {
      return res.status(401).json({ status: false, message: "Invalid state parameter" });
    }

    // Exchange code for tokens
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
      return res.status(401).json({ status: false, message: "No ID token received" });
    }

    // Verify the ID token with JWKS
    const decodedToken = await verifyGoogleToken(id_token);
    if (!decodedToken) {
      return res.status(401).json({ status: false, message: "Invalid ID token" });
    }

    // Validate nonce
    if (!decodedToken.nonce || decodedToken.nonce !== savedNonce) {
      return res.status(401).json({ status: false, message: "Invalid nonce" });
    }

    // Find or create user
    let user = await User.findOne({ googleId: decodedToken.sub });
    if (!user) {
      // Also check by email so existing users can link their Google account
      user = await User.findOne({ email: decodedToken.email });
      if (user) {
        // Link Google ID to existing user
        user.googleId = decodedToken.sub;
        if (!user.profilePic && decodedToken.picture) user.profilePic = decodedToken.picture;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          googleId: decodedToken.sub,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split("@")[0],
          profilePic: decodedToken.picture || "",
        });
      }
    }

    // Generate JWT (same format as existing login)
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || "24h",
    });

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };
    res.cookie("jwtToken", jwtToken, cookieOptions);

    // Redirect to frontend with token in URL (frontend will parse it)
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

module.exports = { registerUser, login, getProfile, logout, updateProfile, googleLogin, googleCallback };
