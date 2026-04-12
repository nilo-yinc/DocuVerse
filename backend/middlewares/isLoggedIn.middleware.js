const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : null;
    const cookieToken = req.cookies?.jwtToken ? String(req.cookies.jwtToken).trim() : null;

    // Prefer bearer token first (latest frontend token), then cookie fallback.
    const tokenCandidates = [headerToken, cookieToken].filter(Boolean);
    if (tokenCandidates.length === 0) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access - No token provided",
      });
    }

    for (const token of tokenCandidates) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
          req.user = decoded;
          return next();
        }
      } catch (_) {
        // Try next token candidate
      }
    }

    return res.status(401).json({
      status: false,
      message: "Unauthorized access - Invalid or expired token",
    });
  } catch (error) {
    console.error("Error verifying token:", error.message);

    return res.status(401).json({
      status: false,
      message: "Unauthorized access",
    });
  }
};

module.exports = isLoggedIn;
