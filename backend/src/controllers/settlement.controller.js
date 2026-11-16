const db = require("../config/db");
const { matchOrdersGreedy } = require("../algorithms/matching");
const { allocateProportionally } = require("../algorithms/allocation");
const { calculateCarbonSavings } = require("../algorithms/carbon");

/**
 * Execute an off-chain energy matching & allocation cycle
 */
async function executeMatchingCycle(req, res, next) {
  try {
    let listings = [];
    let requests = [];

    if (db.isConnected) {
      const listingsRes = await db.query(
        "SELECT id, producer_id as \"producerId\", available_kwh as \"availableKwh\", unit_price_eth as \"unitPriceEth\", energy_source as \"energySource\" FROM energy_listings WHERE status = 'ACTIVE' AND available_kwh > 0"
      );
      listings = listingsRes.rows;

      const requestsRes = await db.query(
        "SELECT id, consumer_id as \"consumerId\", requested_kwh as \"requestedKwh\", max_acceptable_price_eth as \"maxPriceEth\", priority_weight as \"priorityWeight\" FROM energy_requests WHERE status = 'PENDING'"
      );
      requests = requestsRes.rows;
    } else {
      listings = db.inMemoryStore.listings
        .filter(l => l.status === "ACTIVE" && l.available_kwh > 0)
        .map(l => ({
          id: l.id,
          producerId: l.producer_id,
          availableKwh: l.available_kwh,
          unitPriceEth: parseFloat(l.unit_price_eth),
          energySource: l.energy_source,
        }));

      requests = db.inMemoryStore.requests
        .filter(r => r.status === "PENDING")
        .map(r => ({
          id: r.id,
          consumerId: r.consumer_id,
          requestedKwh: r.requested_kwh,
          maxPriceEth: parseFloat(r.max_acceptable_price_eth),
          priorityWeight: r.priority_weight,
        }));
    }

    if (listings.length === 0 || requests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Insufficient active orders to run matching cycle.",
        matchedTrades: [],
      });
    }

    // 1. Run Price-Aware Greedy Matching
    const matchingResult = matchOrdersGreedy(listings, requests, { pricingRule: "MIDPOINT" });

    // 2. Attach Carbon Savings Calculation for each matched trade
    const enrichedMatches = matchingResult.matches.map(m => {
      const carbon = calculateCarbonSavings(m.energyAmountKwh, m.energySource);
      return {
        ...m,
        carbonSavedKg: carbon.carbonSavedKg,
        carbonSavedGrams: carbon.carbonSavedGrams,
        status: "PENDING_ON_CHAIN_SETTLEMENT",
      };
    });

    // 3. Record cycle in database or in-memory
    const cycleRecord = {
      cycleNumber: Date.now(),
      totalDemandKwh: requests.reduce((s, r) => s + r.requestedKwh, 0),
      totalSupplyKwh: listings.reduce((s, l) => s + l.availableKwh, 0),
      matchedTradesCount: enrichedMatches.length,
      matchedTrades: enrichedMatches,
    };

    if (!db.isConnected) {
      db.inMemoryStore.settlements.push(...enrichedMatches);
    }

    res.status(200).json({
      success: true,
      cycle: cycleRecord,
      summary: {
        totalMatchedEnergyKwh: matchingResult.totalMatchedEnergyKwh,
        totalTradeValueEth: matchingResult.totalTradeValueEth,
        matchedCount: enrichedMatches.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get settlement transaction history
 */
async function getSettlements(req, res, next) {
  try {
    if (db.isConnected) {
      const result = await db.query(
        "SELECT s.*, p.name as producer_name, c.name as consumer_name FROM settlement_transactions s JOIN users p ON s.producer_id = p.id JOIN users c ON s.consumer_id = c.id ORDER BY s.created_at DESC"
      );
      return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    }

    res.status(200).json({ success: true, count: db.inMemoryStore.settlements.length, data: db.inMemoryStore.settlements });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  executeMatchingCycle,
  getSettlements,
};
