const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const db = require("../config/db");
const userService = require("../services/userService");
const { sendSuccess } = require("../utils/responseHandler");
const { sendError } = require("../utils/errorHandler");

function getRoleRedirectPath(role) {
  switch (role) {
    case "PRODUCER":
      return "/producer/dashboard";
    case "CONSUMER":
      return "/consumer/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/";
  }
}

class AuthController {
  async register(req, res, next) {
    try {
      const { name, fullName, email, password, role, meterId, walletAddress, phone } = req.body;
      const displayName = fullName || name;

      // Validate required fields
      if (!displayName || !email || !password || !role) {
        return sendError(res, "Missing required fields: name, email, password, and role are mandatory.", 400);
      }

      // Security: Disallow public administrator registration
      if (role === "ADMIN") {
        return sendError(res, "Direct public administrator registration is prohibited. Admin accounts require system provisioning.", 403);
      }

      // Role check
      if (role !== "PRODUCER" && role !== "CONSUMER") {
        return sendError(res, "Role must be either PRODUCER or CONSUMER.", 400);
      }

      // Password strength validation
      if (password.length < 8) {
        return sendError(res, "Password must be at least 8 characters long.", 400);
      }
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return sendError(res, "Password must contain at least one uppercase letter and one number.", 400);
      }

      // Auto-generate meter ID if not supplied
      const finalMeterId = meterId || `METER-${role.substring(0, 4)}-${Date.now().toString().slice(-6)}`;

      const { user, token } = await userService.register({
        email,
        password,
        fullName: displayName,
        name: displayName,
        role,
        meterId: finalMeterId,
        walletAddress,
        phone,
      });

      const redirectPath = getRoleRedirectPath(user.role);

      return res.status(201).json({
        success: true,
        message: "Account registered successfully",
        user,
        data: { user, token },
        token,
        redirectPath,
      });
    } catch (err) {
      if (err.statusCode) {
        return sendError(res, err.message, err.statusCode);
      }
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return sendError(res, "Email and password are required.", 400);
      }

      const normalizedEmail = email.toLowerCase().trim();

      let user = null;
      if (db.isConnected) {
        try {
          const result = await db.query("SELECT * FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
          user = result.rows[0];
        } catch (_) {}
      }
      if (!user) {
        user = db.inMemoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      }

      if (!user) {
        return sendError(res, "Invalid email or password.", 401);
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return sendError(res, "Invalid email or password.", 401);
      }

      if (user.account_status === "SUSPENDED") {
        return sendError(res, "This account is suspended.", 403);
      }

      const token = jwt.sign(
        { id: user.id, userId: user.id, email: user.email, role: user.role },
        config.JWT.SECRET,
        { expiresIn: config.JWT.EXPIRES_IN }
      );

      const safeUser = {
        id: user.id,
        name: user.full_name || user.name,
        fullName: user.full_name || user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.wallet_address,
        wallet_address: user.wallet_address,
        meterId: user.meter_id,
        meter_id: user.meter_id,
        accountStatus: user.account_status,
        reputationScore: user.reputation_score,
      };

      const redirectPath = getRoleRedirectPath(user.role);

      return res.status(200).json({
        success: true,
        message: "Authentication successful",
        user: safeUser,
        data: { user: safeUser, token },
        token,
        redirectPath,
      });
    } catch (err) {
      if (err.statusCode) {
        return sendError(res, err.message, err.statusCode);
      }
      next(err);
    }
  }

  async switchRole(req, res, next) {
    try {
      const { role } = req.body;
      const validRoles = ["CONSUMER", "PRODUCER", "ADMIN"];
      const targetRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : "CONSUMER";

      const targetEmails = {
        ADMIN: "admin@greenledger.io",
        PRODUCER: "producer.solarfarm@greenledger.io",
        CONSUMER: "consumer.datacenter@ecotech.com",
      };

      const email = targetEmails[targetRole];
      let user = null;
      if (db.isConnected) {
        try {
          const result = await db.query("SELECT * FROM users WHERE LOWER(email) = $1", [email.toLowerCase()]);
          user = result.rows[0];
        } catch (_) {}
      }
      if (!user) {
        user = db.inMemoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || db.inMemoryStore.users[0];
      }

      const token = jwt.sign(
        { id: user.id, userId: user.id, email: user.email, role: user.role },
        config.JWT.SECRET,
        { expiresIn: config.JWT.EXPIRES_IN }
      );

      const safeUser = {
        id: user.id,
        name: user.full_name || user.name,
        fullName: user.full_name || user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.wallet_address,
        wallet_address: user.wallet_address,
        meterId: user.meter_id,
        meter_id: user.meter_id,
        accountStatus: user.account_status,
        reputationScore: user.reputation_score,
      };

      return res.status(200).json({
        success: true,
        message: `Successfully switched active session to ${targetRole}`,
        user: safeUser,
        data: { user: safeUser, token },
        token,
        redirectPath: getRoleRedirectPath(user.role),
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    return sendSuccess(res, null, "Logged out successfully");
  }

  async me(req, res, next) {
    return this.getProfile(req, res, next);
  }

  async getProfile(req, res, next) {
    try {
      const targetId = req.user.id || req.user.userId;
      const user = await userService.getUserById(targetId);
      return res.status(200).json({
        success: true,
        user,
        data: user,
      });
    } catch (err) {
      if (err.statusCode) {
        return sendError(res, err.message, err.statusCode);
      }
      next(err);
    }
  }

  async requestNonce(req, res, next) {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return sendError(res, "A valid Ethereum wallet address is required.", 400);
      }

      const rawNonce = Math.floor(Math.random() * 1000000).toString();
      const nonce = `Sign this message to authenticate with GreenLedger. Nonce: ${rawNonce}`;

      return res.status(200).json({
        success: true,
        nonce,
        walletAddress: walletAddress.toLowerCase(),
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      return res.status(200).json({
        success: true,
        message: `If an account exists for ${email || "this address"}, password reset instructions have been sent.`,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
