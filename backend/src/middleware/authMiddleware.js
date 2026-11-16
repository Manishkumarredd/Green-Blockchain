const jwt = require("jsonwebtoken");
const config = require("../config/env");
const db = require("../config/db");
const { sendError } = require("../utils/errorHandler");

/**
 * JWT Authentication Middleware
 * Validates Bearer token, decodes payload, and checks account status.
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return sendError(res, "Authentication token is missing. Please provide a valid Bearer token.", 401);
  }

  try {
    const decoded = jwt.verify(token, config.JWT.SECRET);

    // Verify account is active
    let user = null;
    if (db.isConnected) {
      const result = await db.query(
        "SELECT id, full_name, email, role, wallet_address, meter_id, account_status FROM users WHERE id = $1",
        [decoded.id]
      );
      user = result.rows[0];
    } else {
      user = db.inMemoryStore.users.find((u) => u.id === decoded.id);
    }

    if (!user) {
      return sendError(res, "User associated with this token does not exist.", 401);
    }

    if (user.account_status === "SUSPENDED") {
      return sendError(res, "Account is suspended. Please contact platform compliance support.", 403);
    }

    // Attach validated, verified database user to request (never trust client-supplied role)
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name || user.name,
      role: user.role,
      walletAddress: user.wallet_address,
      meterId: user.meter_id,
      accountStatus: user.account_status,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, "Authentication token has expired. Please log in again.", 401);
    }
    return sendError(res, "Invalid authentication token signature.", 403);
  }
}

module.exports = {
  authenticateToken,
};
