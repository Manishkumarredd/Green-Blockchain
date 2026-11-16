const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const config = require("../config/env");
const db = require("../config/db");

// Password policy validator: min 8 chars, 1 uppercase, 1 lowercase, 1 number
function validatePassword(password) {
  if (!password || typeof password !== "string") return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasUpper && hasLower && hasDigit;
}

// Email format validator
function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Register a new Producer or Consumer
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role, phone, walletAddress } = req.body;

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Full name is required (minimum 2 characters).",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "A valid email address is required.",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      });
    }

    const normalizedRole = (role || "").toUpperCase().trim();
    if (normalizedRole === "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Public administrator registration is prohibited. Administrator accounts must be securely provisioned.",
      });
    }

    if (!["PRODUCER", "CONSUMER"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        error: "Role must be specified as either 'PRODUCER' or 'CONSUMER'.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanWallet = walletAddress ? walletAddress.trim().toLowerCase() : null;

    // 2. Duplicate Check
    if (db.isConnected) {
      const emailCheck = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: "An account with this email address already exists. Please sign in instead.",
        });
      }

      if (cleanWallet) {
        const walletCheck = await db.query("SELECT id FROM users WHERE LOWER(wallet_address) = $1", [cleanWallet]);
        if (walletCheck.rows.length > 0) {
          return res.status(409).json({
            success: false,
            error: "This Ethereum wallet address is already linked to another account.",
          });
        }
      }
    } else {
      const existingUser = db.inMemoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "An account with this email address already exists. Please sign in instead.",
        });
      }

      if (cleanWallet) {
        const existingWallet = db.inMemoryStore.users.find(
          (u) => u.wallet_address && u.wallet_address.toLowerCase() === cleanWallet
        );
        if (existingWallet) {
          return res.status(409).json({
            success: false,
            error: "This Ethereum wallet address is already linked to another account.",
          });
        }
      }
    }

    // 3. Hash Password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Generate unique meter identifier
    const meterId = `METER-${normalizedRole.slice(0, 4)}-${Date.now().toString().slice(-6)}`;

    // 5. Insert Record
    let newUser;
    if (db.isConnected) {
      const insertResult = await db.query(
        `INSERT INTO users (name, email, password_hash, role, phone, wallet_address, meter_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id, name, email, role, phone, wallet_address, meter_id, is_active, reputation_score, created_at`,
        [name.trim(), cleanEmail, passwordHash, normalizedRole, phone || null, cleanWallet, meterId]
      );
      newUser = insertResult.rows[0];

      // Insert corresponding initial profile
      if (normalizedRole === "PRODUCER") {
        await db.query(
          `INSERT INTO producer_profiles (user_id, energy_source, capacity_kw, base_price_per_kwh, location_grid)
           VALUES ($1, 'SOLAR', 100.00, 0.00008500, 'Microgrid-Alpha-Sector-1')`,
          [newUser.id]
        );
      } else {
        await db.query(
          `INSERT INTO consumer_profiles (user_id, priority_tier, max_budget_per_kwh)
           VALUES ($1, 'STANDARD', 0.00010000)`,
          [newUser.id]
        );
      }
    } else {
      newUser = {
        id: db.inMemoryStore.users.length + 1,
        name: name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role: normalizedRole,
        phone: phone || null,
        wallet_address: cleanWallet || `0x${crypto.randomBytes(20).toString("hex")}`,
        meter_id: meterId,
        is_active: true,
        reputation_score: 100.0,
        created_at: new Date().toISOString(),
      };
      db.inMemoryStore.users.push(newUser);
    }

    // 6. Sign JWT
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        meterId: newUser.meter_id,
        walletAddress: newUser.wallet_address,
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

    const redirectPath =
      newUser.role === "PRODUCER"
        ? "/producer/dashboard"
        : newUser.role === "CONSUMER"
        ? "/consumer/dashboard"
        : "/admin/dashboard";

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      redirectPath,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        walletAddress: newUser.wallet_address,
        meterId: newUser.meter_id,
        reputationScore: newUser.reputation_score,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Login with email and password
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch User Record
    let user;
    if (db.isConnected) {
      const result = await db.query("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
      }
      user = result.rows[0];
    } else {
      user = db.inMemoryStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email or password.",
        });
      }
    }

    // 2. Check Active Status
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account has been suspended or deactivated. Contact platform administrator.",
      });
    }

    // 3. Compare Password Hash
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Fallback for default test password if hash is missing
      isMatch = password === "Password123!";
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        meterId: user.meter_id,
        walletAddress: user.wallet_address,
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

    const redirectPath =
      user.role === "PRODUCER"
        ? "/producer/dashboard"
        : user.role === "CONSUMER"
        ? "/consumer/dashboard"
        : "/admin/dashboard";

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      redirectPath,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        meterId: user.meter_id,
        walletAddress: user.wallet_address,
        reputationScore: user.reputation_score,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve authenticated user profile
 */
async function getProfile(req, res, next) {
  try {
    const { userId } = req.user;

    let user;
    if (db.isConnected) {
      const result = await db.query(
        "SELECT id, name, email, role, phone, wallet_address, meter_id, is_active, reputation_score, created_at FROM users WHERE id = $1",
        [userId]
      );
      user = result.rows[0];
    } else {
      user = db.inMemoryStore.users.find((u) => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: "User profile not found." });
    }

    const sanitized = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      walletAddress: user.wallet_address,
      meterId: user.meter_id,
      reputationScore: user.reputation_score,
      createdAt: user.created_at,
    };

    return res.status(200).json({ success: true, user: sanitized });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout
 */
async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

/**
 * Request cryptographically random nonce for Web3 signature authentication
 */
async function requestNonce(req, res, next) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: "walletAddress is required." });
    }

    const cleanWallet = walletAddress.trim().toLowerCase();
    const nonce = `Sign this message to authenticate with GreenLedger:\nNonce: ${crypto.randomBytes(16).toString("hex")}\nTimestamp: ${Date.now()}`;

    // Store nonce on user or in-memory
    if (db.isConnected) {
      await db.query("UPDATE users SET nonce = $1 WHERE LOWER(wallet_address) = $2", [nonce, cleanWallet]);
    } else {
      const u = db.inMemoryStore.users.find(
        (x) => x.wallet_address && x.wallet_address.toLowerCase() === cleanWallet
      );
      if (u) u.nonce = nonce;
    }

    return res.status(200).json({
      success: true,
      walletAddress: cleanWallet,
      nonce,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Forgot password simulation
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, error: "A valid email address is required." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check user existence
    let userExists = false;
    if (db.isConnected) {
      const result = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
      userExists = result.rows.length > 0;
    } else {
      userExists = db.inMemoryStore.users.some((u) => u.email.toLowerCase() === cleanEmail);
    }

    // Always return neutral response to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  logout,
  requestNonce,
  forgotPassword,
};
