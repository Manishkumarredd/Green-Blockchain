const { sendError } = require("../utils/errorHandler");

/**
 * Role-Based Access Control Middleware
 * Roles: 'PRODUCER', 'CONSUMER', 'ADMIN'
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, "Access denied: Verified user role not found in authentication context.", 403);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access forbidden: Requires one of [${allowedRoles.join(", ")}], but your authenticated role is '${req.user.role}'.`,
        403
      );
    }

    next();
  };
}

module.exports = {
  requireRoles,
};
