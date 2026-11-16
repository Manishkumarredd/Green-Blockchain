const db = require("../config/db");

async function getUsers(req, res, next) {
  try {
    if (db.isConnected) {
      const result = await db.query("SELECT id, wallet_address, name, role, meter_id, is_active, reputation_score, created_at FROM users ORDER BY id ASC");
      return res.status(200).json({ success: true, count: result.rows.length, users: result.rows });
    }

    res.status(200).json({ success: true, count: db.inMemoryStore.users.length, users: db.inMemoryStore.users });
  } catch (err) {
    next(err);
  }
}

async function getPricingParameters(req, res, next) {
  try {
    if (db.isConnected) {
      const result = await db.query("SELECT * FROM system_pricing_parameters ORDER BY id DESC LIMIT 1");
      return res.status(200).json({ success: true, parameters: result.rows[0] });
    }

    res.status(200).json({
      success: true,
      parameters: {
        baseGridTariffEth: 0.00010000,
        peakDemandMultiplier: 1.25,
        offPeakMultiplier: 0.85,
        carbonIntensityFactor: 0.8200,
        adminCommissionRate: 0.015,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getPlatformStats(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      stats: {
        totalParticipants: db.isConnected ? 7 : db.inMemoryStore.users.length,
        totalEnergyTradedKwh: 48500.0,
        totalEthVolume: 4.8453,
        totalCarbonSavedKg: 34030.0,
        activeListingsCount: db.isConnected ? 3 : db.inMemoryStore.listings.length,
        pendingRequestsCount: db.isConnected ? 3 : db.inMemoryStore.requests.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getPricingParameters,
  getPlatformStats,
};
