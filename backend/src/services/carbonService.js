const db = require("../config/db");

class CarbonService {
  async getCarbonSummary() {
    if (db.isConnected) {
      const res = await db.query(`
        SELECT 
          COALESCE(SUM(renewable_energy_kwh), 0) as total_clean_kwh,
          COALESCE(SUM(estimated_carbon_savings), 0) as total_carbon_kg,
          COUNT(*) as total_records
        FROM carbon_records
      `);
      const row = res.rows[0];
      const cleanKwh = Number(row.total_clean_kwh);
      const carbonKg = Number(row.total_carbon_kg);
      const treeEquivalent = Number((carbonKg / 21.77).toFixed(1)); // EPA factor ~21.77 kg CO2 / tree / year

      return {
        totalCleanEnergyKwh: cleanKwh,
        totalCarbonAvoidedKg: carbonKg,
        gridEmissionBaselineKgPerKwh: 0.82,
        equivalentTreesPlanted: treeEquivalent,
        passengerVehicleKmOffset: Number((carbonKg * 4.1).toFixed(1)),
        recordsCount: parseInt(row.total_records, 10),
      };
    } else {
      const totalCleanKwh = db.inMemoryStore.carbon_records.reduce((sum, r) => sum + Number(r.renewable_energy_kwh || 0), 0);
      const totalCarbonKg = db.inMemoryStore.carbon_records.reduce((sum, r) => sum + Number(r.estimated_carbon_savings || 0), 0);
      const treeEquivalent = Number((totalCarbonKg / 21.77).toFixed(1));

      return {
        totalCleanEnergyKwh: totalCleanKwh,
        totalCarbonAvoidedKg: totalCarbonKg,
        gridEmissionBaselineKgPerKwh: 0.82,
        equivalentTreesPlanted: treeEquivalent,
        passengerVehicleKmOffset: Number((totalCarbonKg * 4.1).toFixed(1)),
        recordsCount: db.inMemoryStore.carbon_records.length,
      };
    }
  }

  async getUserCarbonRecords(userId) {
    if (db.isConnected) {
      const res = await db.query(
        `SELECT cr.*, t.energy_quantity_kwh, t.price_per_kwh, t.created_at as transaction_date
         FROM carbon_records cr
         JOIN energy_transactions t ON cr.transaction_id = t.id
         WHERE t.consumer_id = $1 OR t.producer_id = $1
         ORDER BY cr.created_at DESC`,
        [userId]
      );
      return res.rows;
    } else {
      const userTxIds = db.inMemoryStore.energy_transactions
        .filter((t) => t.consumer_id === userId || t.producer_id === userId)
        .map((t) => t.id);

      return db.inMemoryStore.carbon_records.filter((r) => userTxIds.includes(r.transaction_id));
    }
  }
}

module.exports = new CarbonService();
