const db = require("../config/db");
const { calculateDynamicPrice } = require("../algorithms/pricing");
const EnergySimulator = require("../services/energySimulator");

/**
 * Get active energy listings
 */
async function getListings(req, res, next) {
  try {
    if (db.isConnected) {
      const result = await db.query(
        "SELECT l.*, u.name as producer_name, u.wallet_address FROM energy_listings l JOIN users u ON l.producer_id = u.id WHERE l.status = 'ACTIVE' ORDER BY l.unit_price_eth ASC"
      );
      return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    }

    const listings = db.inMemoryStore.listings.filter(l => l.status === "ACTIVE");
    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    next(err);
  }
}

/**
 * Producer creates a new energy listing
 */
async function createListing(req, res, next) {
  try {
    const { energySource, quantityKwh, unitPriceEth, minPurchaseKwh = 1.0 } = req.body;
    const producerId = req.user.userId;

    if (!energySource || !quantityKwh || !unitPriceEth) {
      return res.status(400).json({ success: false, error: "energySource, quantityKwh, and unitPriceEth are required" });
    }

    if (db.isConnected) {
      const result = await db.query(
        `INSERT INTO energy_listings (producer_id, energy_source, quantity_kwh, available_kwh, unit_price_eth, min_purchase_kwh, listing_window_start, listing_window_end)
         VALUES ($1, $2, $3, $3, $4, $5, NOW(), NOW() + INTERVAL '12 hours') RETURNING *`,
        [producerId, energySource, quantityKwh, unitPriceEth, minPurchaseKwh]
      );
      return res.status(201).json({ success: true, data: result.rows[0] });
    }

    const newListing = {
      id: db.inMemoryStore.listings.length + 1,
      producer_id: producerId,
      energy_source: energySource,
      quantity_kwh: Number(quantityKwh),
      available_kwh: Number(quantityKwh),
      unit_price_eth: String(unitPriceEth),
      min_purchase_kwh: Number(minPurchaseKwh),
      status: "ACTIVE",
    };
    db.inMemoryStore.listings.push(newListing);

    res.status(201).json({ success: true, data: newListing });
  } catch (err) {
    next(err);
  }
}

/**
 * Get active energy requests
 */
async function getRequests(req, res, next) {
  try {
    if (db.isConnected) {
      const result = await db.query(
        "SELECT r.*, u.name as consumer_name, u.wallet_address FROM energy_requests r JOIN users u ON r.consumer_id = u.id WHERE r.status = 'PENDING' ORDER BY r.priority_weight DESC"
      );
      return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    }

    const requests = db.inMemoryStore.requests.filter(r => r.status === "PENDING");
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    next(err);
  }
}

/**
 * Consumer creates a new energy request
 */
async function createRequest(req, res, next) {
  try {
    const { requestedKwh, maxPriceEth, priorityWeight = 1.0, urgencyLevel = "NORMAL" } = req.body;
    const consumerId = req.user.userId;

    if (!requestedKwh || !maxPriceEth) {
      return res.status(400).json({ success: false, error: "requestedKwh and maxPriceEth are required" });
    }

    if (db.isConnected) {
      const result = await db.query(
        `INSERT INTO energy_requests (consumer_id, requested_kwh, max_acceptable_price_eth, priority_weight, urgency_level)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [consumerId, requestedKwh, maxPriceEth, priorityWeight, urgencyLevel]
      );
      return res.status(201).json({ success: true, data: result.rows[0] });
    }

    const newRequest = {
      id: db.inMemoryStore.requests.length + 1,
      consumer_id: consumerId,
      requested_kwh: Number(requestedKwh),
      allocated_kwh: 0,
      max_acceptable_price_eth: String(maxPriceEth),
      priority_weight: Number(priorityWeight),
      urgency_level: urgencyLevel,
      status: "PENDING",
    };
    db.inMemoryStore.requests.push(newRequest);

    res.status(201).json({ success: true, data: newRequest });
  } catch (err) {
    next(err);
  }
}

/**
 * Dynamic pricing recommendation
 */
async function getDynamicPriceQuote(req, res, next) {
  try {
    const { energySource = "SOLAR", hourOfDay } = req.query;

    const listings = db.isConnected
      ? (await db.query("SELECT SUM(available_kwh) as total_supply FROM energy_listings WHERE status = 'ACTIVE'")).rows[0].total_supply || 500
      : db.inMemoryStore.listings.reduce((sum, l) => sum + (l.status === "ACTIVE" ? l.availableKwh || l.available_kwh : 0), 0);

    const demands = db.isConnected
      ? (await db.query("SELECT SUM(requested_kwh) as total_demand FROM energy_requests WHERE status = 'PENDING'")).rows[0].total_demand || 300
      : db.inMemoryStore.requests.reduce((sum, r) => sum + (r.status === "PENDING" ? r.requested_kwh : 0), 0);

    const quote = calculateDynamicPrice({
      totalSupplyKwh: Number(listings) || 100,
      totalDemandKwh: Number(demands) || 100,
      hourOfDay: hourOfDay !== undefined ? parseInt(hourOfDay, 10) : new Date().getHours(),
      energySource,
    });

    res.status(200).json({ success: true, quote });
  } catch (err) {
    next(err);
  }
}

/**
 * Simulated generation feed for producers
 */
async function getSimulatedFeed(req, res, next) {
  try {
    const hour = new Date().getHours();
    const solar = EnergySimulator.simulateSolar(100, hour, 0.1, 28);
    const wind = EnergySimulator.simulateWind(200, 8.5);
    const hydro = EnergySimulator.simulateHydro(80, 3.5, 25);

    res.status(200).json({
      success: true,
      simulationTimestamp: new Date().toISOString(),
      hourOfDay: hour,
      sources: {
        solar,
        wind,
        hydro,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getListings,
  createListing,
  getRequests,
  createRequest,
  getDynamicPriceQuote,
  getSimulatedFeed,
};
