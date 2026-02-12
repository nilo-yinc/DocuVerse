const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  try {
    // 1. extract token from cookies or Authorization header
    let token = req.cookies.jwtToken;
    
    // Fallback to Authorization header if cookie is not present (for cross-origin requests)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // 2. check if token exists
    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access - No token provided",
      });
    }

    // 3. verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. check if user exists
    if (!decoded) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
      });
    }

    // 5. pass the user data to the next middleware
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    
    // Handle specific JWT errors as 401
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access - Invalid or expired token",
      });
    }

    return res.status(500).json({
      status: false,
      message: "Internal server error during authentication",
    });
  }
};

module.exports = isLoggedIn;
