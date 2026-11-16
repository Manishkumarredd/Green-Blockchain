const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * JWT Verification Middleware
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication token is missing. Please provide a valid Bearer token.",
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT.SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token.",
    });
  }
}

/**
 * Role-Based Access Control Middleware
 * Roles: 'PRODUCER', 'CONSUMER', 'ADMIN'
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        error: "Access denied: User role could not be verified.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access forbidden: Requires one of [${allowedRoles.join(", ")}], your role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles,
};
