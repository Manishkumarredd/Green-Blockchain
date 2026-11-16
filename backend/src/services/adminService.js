const db = require("../config/db");
const { AppError } = require("../utils/errorHandler");

class AdminService {
  async getAdminDashboardStats() {
    let users = [];
    let listings = [];
    let transactions = [];
    let settings = [];

    if (db.isConnected) {
      const uRes = await db.query("SELECT role, account_status FROM users");
      users = uRes.rows;
      const lRes = await db.query("SELECT listing_status, total_energy_kwh, available_energy_kwh FROM energy_listings");
      listings = lRes.rows;
      const tRes = await db.query("SELECT energy_quantity_kwh, total_amount, transaction_status FROM energy_transactions");
      transactions = tRes.rows;
      const sRes = await db.query("SELECT * FROM platform_settings");
      settings = sRes.rows;
    } else {
      users = db.inMemoryStore.users;
      listings = db.inMemoryStore.energy_listings;
      transactions = db.inMemoryStore.energy_transactions;
      settings = db.inMemoryStore.platform_settings;
    }

    const producersCount = users.filter((u) => u.role === "PRODUCER").length;
    const consumersCount = users.filter((u) => u.role === "CONSUMER").length;
    const totalTradedKwh = transactions.reduce((sum, t) => sum + Number(t.energy_quantity_kwh || 0), 0);
    const totalVolumeEth = transactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const carbonAvoidedKg = Number((totalTradedKwh * 0.82).toFixed(2));

    return {
      totalUsers: users.length,
      producersCount,
      consumersCount,
      activeListingsCount: listings.filter((l) => (l.listing_status || l.status) === "ACTIVE").length,
      totalTransactionsCount: transactions.length,
      totalEnergyTradedKwh: totalTradedKwh,
      totalTradingVolumeEth: totalVolumeEth.toFixed(8),
      totalCarbonAvoidedKg: carbonAvoidedKg,
      platformSettings: settings,
      systemHealth: "OPTIMAL",
    };
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

  async getAllListings() {
    if (db.isConnected) {
      const sql = `
        SELECT l.*, u.full_name as producer_name, u.email as producer_email
        FROM energy_listings l
        JOIN users u ON l.producer_id = u.id
        ORDER BY l.created_at DESC
      `;
      const res = await db.query(sql);
      return res.rows;
    } else {
      return db.inMemoryStore.energy_listings.map((l) => {
        const u = db.inMemoryStore.users.find((user) => user.id === l.producer_id) || {};
        return {
          ...l,
          producer_name: u.full_name || u.name,
          producer_email: u.email,
        };
      });
    }
  }

  async getPlatformSettings() {
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM platform_settings ORDER BY id ASC");
      return res.rows;
    } else {
      return db.inMemoryStore.platform_settings;
    }
  }

  async updatePlatformSetting(key, value) {
    if (db.isConnected) {
      const check = await db.query("SELECT * FROM platform_settings WHERE setting_key = $1", [key]);
      let res;
      if (check.rows.length > 0) {
        res = await db.query(
          "UPDATE platform_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2 RETURNING *",
          [value, key]
        );
      } else {
        res = await db.query(
          "INSERT INTO platform_settings (setting_key, setting_value) VALUES ($1, $2) RETURNING *",
          [key, value]
        );
      }
      return res.rows[0];
    } else {
      let setting = db.inMemoryStore.platform_settings.find((s) => s.setting_key === key);
      if (setting) {
        setting.setting_value = value;
        setting.updated_at = new Date();
      } else {
        setting = {
          id: db.inMemoryStore.platform_settings.length + 1,
          setting_key: key,
          setting_value: value,
          updated_at: new Date(),
        };
        db.inMemoryStore.platform_settings.push(setting);
      }
      return setting;
    }
  }
}

module.exports = new AdminService();
