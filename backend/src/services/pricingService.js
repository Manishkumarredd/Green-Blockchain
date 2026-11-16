const db = require("../config/db");
const { calculateDynamicPrice } = require("../algorithms/pricing");

class PricingService {
  async getCurrentPrice(energySource = "SOLAR") {
    let supplyKwh = 550;
    let demandKwh = 330;

    if (db.isConnected) {
      const supplyRes = await db.query(
        "SELECT SUM(available_energy_kwh) as total FROM energy_listings WHERE listing_status = 'ACTIVE'"
      );
      const demandRes = await db.query(
        "SELECT SUM(requested_energy_kwh) as total FROM energy_requests WHERE request_status = 'PENDING'"
      );
      supplyKwh = Number(supplyRes.rows[0].total || 550);
      demandKwh = Number(demandRes.rows[0].total || 330);
    } else {
      supplyKwh = db.inMemoryStore.energy_listings.reduce(
        (sum, l) => sum + Number(l.available_energy_kwh || 0),
        0
      );
      demandKwh = db.inMemoryStore.energy_requests.reduce(
        (sum, r) => sum + Number(r.requested_energy_kwh || r.requested_kwh || 0),
        0
      );
    }

    const pricing = calculateDynamicPrice({
      totalSupplyKwh: supplyKwh,
      totalDemandKwh: demandKwh,
      energySource,
      hourOfDay: new Date().getHours(),
    });

    return {
      currentHour: new Date().getHours(),
      energySource,
      supplyKwh,
      demandKwh,
      ...pricing,
    };
  }

  async calculatePriceFormula({ basePrice = 0.00012, supplyKwh, demandKwh, minPrice = 0.00007, maxPrice = 0.00018 }) {
    const supply = Math.max(0.01, supplyKwh);
    const demand = Math.max(0.01, demandKwh);
    const ratio = demand / supply;

    // Rule-based elasticity swing: [-0.25, +0.25]
    const imbalance = (demand - supply) / (demand + supply);
    const elasticityAdjustment = 1.0 + imbalance * 0.25;

    let calculatedPrice = basePrice * elasticityAdjustment;
    calculatedPrice = Math.min(maxPrice, Math.max(minPrice, calculatedPrice));

    const record = {
      base_price: basePrice.toFixed(8),
      supply_quantity: supplyKwh,
      demand_quantity: demandKwh,
      supply_demand_ratio: Number(ratio.toFixed(4)),
      calculated_price: calculatedPrice.toFixed(8),
      minimum_price: minPrice.toFixed(8),
      maximum_price: maxPrice.toFixed(8),
      created_at: new Date(),
    };

    if (db.isConnected) {
      const res = await db.query(
        `INSERT INTO pricing_history (base_price, supply_quantity, demand_quantity, supply_demand_ratio, calculated_price, minimum_price, maximum_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [record.base_price, supplyKwh, demandKwh, record.supply_demand_ratio, record.calculated_price, record.minimum_price, record.maximum_price]
      );
      return res.rows[0];
    } else {
      record.id = db.inMemoryStore.pricing_history.length + 1;
      db.inMemoryStore.pricing_history.unshift(record);
      return record;
    }
  }

  async getPricingHistory(limit = 20) {
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM pricing_history ORDER BY created_at DESC LIMIT $1", [limit]);
      return res.rows;
    } else {
      return db.inMemoryStore.pricing_history.slice(0, limit);
    }
  }
}

module.exports = new PricingService();
