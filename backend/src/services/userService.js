const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const config = require("../config/env");
const { AppError } = require("../utils/errorHandler");

class UserService {
  async register({ email, password, fullName, name, role, meterId, walletAddress, phone }) {
    const displayName = fullName || name;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check duplicate email or meter_id
    if (db.isConnected) {
      const existing = await db.query(
        "SELECT id, email, meter_id FROM users WHERE LOWER(email) = $1 OR meter_id = $2",
        [normalizedEmail, meterId]
      );
      if (existing.rows.length > 0) {
        if (existing.rows[0].email.toLowerCase() === normalizedEmail) {
          throw new AppError("An account with this email address already exists.", 409);
        }
        throw new AppError("A smart meter with this ID is already registered.", 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const insertRes = await db.query(
        `INSERT INTO users (full_name, email, password_hash, role, meter_id, wallet_address, phone, account_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         RETURNING id, full_name, email, role, meter_id, wallet_address, account_status, created_at`,
        [displayName, normalizedEmail, passwordHash, role, meterId, walletAddress || null, phone || null]
      );

      const user = insertRes.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.JWT.SECRET, {
        expiresIn: config.JWT.EXPIRES_IN,
      });

      return { user, token };
    } else {
      // In-Memory Fallback
      const existing = db.inMemoryStore.users.find(
        (u) => u.email.toLowerCase() === normalizedEmail || u.meter_id === meterId
      );
      if (existing) {
        if (existing.email.toLowerCase() === normalizedEmail) {
          throw new AppError("An account with this email address already exists.", 409);
        }
        throw new AppError("A smart meter with this ID is already registered.", 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        id: db.inMemoryStore.users.length + 1,
        full_name: displayName,
        name: displayName,
        email: normalizedEmail,
        password_hash: passwordHash,
        role,
        meter_id: meterId,
        wallet_address: walletAddress || null,
        phone: phone || null,
        account_status: "ACTIVE",
        reputation_score: 100.0,
        created_at: new Date(),
      };

      db.inMemoryStore.users.push(newUser);

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, config.JWT.SECRET, {
        expiresIn: config.JWT.EXPIRES_IN,
      });

      const { password_hash, ...safeUser } = newUser;
      return { user: safeUser, token };
    }
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
      user = res.rows[0];
    } else {
      user = db.inMemoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      throw new AppError("Invalid email address or password.", 401);
    }

    if (user.account_status === "SUSPENDED") {
      throw new AppError("This account is currently suspended. Please contact platform administration.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError("Invalid email address or password.", 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.JWT.SECRET, {
      expiresIn: config.JWT.EXPIRES_IN,
    });

    const safeUser = {
      id: user.id,
      fullName: user.full_name || user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.wallet_address,
      meterId: user.meter_id,
      accountStatus: user.account_status,
      reputationScore: user.reputation_score,
      createdAt: user.created_at,
    };

    return { user: safeUser, token };
  }

  async getUserById(id) {
    let user = null;
    if (db.isConnected) {
      const res = await db.query(
        "SELECT id, full_name, email, role, wallet_address, meter_id, account_status, reputation_score, created_at FROM users WHERE id = $1",
        [id]
      );
      user = res.rows[0];
    } else {
      user = db.inMemoryStore.users.find((u) => u.id === id);
    }

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    return {
      id: user.id,
      fullName: user.full_name || user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.wallet_address,
      meterId: user.meter_id,
      accountStatus: user.account_status,
      reputationScore: user.reputation_score,
      createdAt: user.created_at,
    };
  }

  async updateProfile(id, updates) {
    if (db.isConnected) {
      const fields = [];
      const values = [];
      let idx = 1;

      if (updates.fullName) {
        fields.push(`full_name = $${idx++}`);
        values.push(updates.fullName);
      }
      if (updates.phone) {
        fields.push(`phone = $${idx++}`);
        values.push(updates.phone);
      }
      if (updates.walletAddress) {
        fields.push(`wallet_address = $${idx++}`);
        values.push(updates.walletAddress);
      }

      if (fields.length === 0) return this.getUserById(id);

      values.push(id);
      const sql = `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, full_name, email, role, wallet_address, meter_id, account_status, reputation_score, created_at`;
      const res = await db.query(sql, values);
      return res.rows[0];
    } else {
      const user = db.inMemoryStore.users.find((u) => u.id === id);
      if (!user) throw new AppError("User not found.", 404);
      if (updates.fullName) {
        user.full_name = updates.fullName;
        user.name = updates.fullName;
      }
      if (updates.phone) user.phone = updates.phone;
      if (updates.walletAddress) user.wallet_address = updates.walletAddress;
      const { password_hash, ...safe } = user;
      return safe;
    }
  }

  async getAllUsers() {
    if (db.isConnected) {
      const res = await db.query(
        "SELECT id, full_name, email, role, wallet_address, meter_id, account_status, reputation_score, created_at FROM users ORDER BY id ASC"
      );
      return res.rows;
    } else {
      return db.inMemoryStore.users.map(({ password_hash, ...u }) => u);
    }
  }
}

module.exports = new UserService();
