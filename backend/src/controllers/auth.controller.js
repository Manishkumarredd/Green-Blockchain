const jwt = require("jsonwebtoken");
const config = require("../config/env");
const db = require("../config/db");

/**
 * Login or authenticate with wallet address
 */
async function walletAuth(req, res, next) {
  try {
    const { walletAddress, role = "CONSUMER", name } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ success: false, error: "walletAddress is required" });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Check in database or in-memory store
    let user;
    if (db.isConnected) {
      const result = await db.query("SELECT * FROM users WHERE LOWER(wallet_address) = $1", [normalizedAddress]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      } else {
        // Register new user
        const insertResult = await db.query(
          "INSERT INTO users (wallet_address, name, role, meter_id) VALUES ($1, $2, $3, $4) RETURNING *",
          [walletAddress, name || `User-${walletAddress.slice(0, 6)}`, role, `METER-${Date.now()}`]
        );
        user = insertResult.rows[0];
      }
    } else {
      user = db.inMemoryStore.users.find(u => u.wallet_address.toLowerCase() === normalizedAddress);
      if (!user) {
        user = {
          id: db.inMemoryStore.users.length + 1,
          wallet_address: walletAddress,
          email: `${role.toLowerCase()}-${Date.now()}@greenledger.local`,
          name: name || `User-${walletAddress.slice(0, 6)}`,
          role: role.toUpperCase(),
          meter_id: `METER-${Date.now()}`,
          is_active: true,
          reputation_score: 100.0,
        };
        db.inMemoryStore.users.push(user);
      }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        walletAddress: user.wallet_address,
        role: user.role,
        meterId: user.meter_id,
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        role: user.role,
        name: user.name,
        meterId: user.meter_id,
        reputationScore: user.reputation_score,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  walletAuth,
  getCurrentUser,
};
