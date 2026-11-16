/**
 * GreenLedger Price-Aware Greedy Matching Engine
 * 
 * Implements a double-auction merit-order greedy matching mechanism connecting
 * renewable energy producers and consumers.
 * 
 * Principles:
 * 1. Filter active listings that satisfy consumer price constraints (Ask <= Bid).
 * 2. Rank eligible listings ascending by asking price (cheapest green electricity first).
 * 3. Rank consumer bids descending by maximum willingness-to-pay and priority weight.
 * 4. Deterministic tie-breaking rules:
 *    - For equal ask prices: earlier listing timestamp, then smaller listing ID.
 *    - For equal bid prices: higher priority weight, earlier request timestamp, then smaller request ID.
 * 5. Greedily matches orders up to the minimum of available supply and demand.
 * 6. Generates deterministic trade proposals without prematurely settling blockchain transactions.
 */

const crypto = require("crypto");

/**
 * Execute Price-Aware Greedy Merit-Order Matching
 * 
 * @param {Array<{id: number|string, producerId: number|string, availableKwh: number, pricePerKwh?: number, unitPriceEth?: number, energySource?: string, createdAt?: Date|string}>} listings
 * @param {Array<{id: number|string, consumerId: number|string, requestedKwh: number, maxPrice?: number, maxPriceEth?: number, priorityWeight?: number, createdAt?: Date|string}>} requests
 * @param {object} [options]
 * @param {string} [options.pricingRule="MIDPOINT"] "PRODUCER_ASK" | "CONSUMER_BID" | "MIDPOINT"
 */
function matchOrdersGreedy(listings, requests, options = {}) {
  const startTime = process.hrtime();
  const pricingRule = options.pricingRule || "MIDPOINT";

  // 1. Filter and normalize valid active producer asks
  const activeAsks = (listings || [])
    .filter((l) => {
      const avail = Number(l.available_energy_kwh ?? l.availableKwh ?? 0);
      const price = Number(l.price_per_kwh ?? l.pricePerKwh ?? l.unitPriceEth ?? 0);
      return avail > 0 && price > 0;
    })
    .map((l) => ({
      id: l.id,
      producerId: l.producer_id ?? l.producerId,
      availableKwh: Number(l.available_energy_kwh ?? l.availableKwh),
      pricePerKwh: Number(l.price_per_kwh ?? l.pricePerKwh ?? l.unitPriceEth),
      energySource: l.energy_source ?? l.energySource ?? "SOLAR",
      createdAt: l.created_at ?? l.createdAt ?? new Date(0),
    }))
    // 2. Rank by lowest price (merit-order) with deterministic tie-breaking
    .sort((a, b) => {
      if (a.pricePerKwh !== b.pricePerKwh) {
        return a.pricePerKwh - b.pricePerKwh; // Cheapest ask first
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) return timeA - timeB; // Earlier listing first
      return String(a.id).localeCompare(String(b.id)); // Deterministic ID tie-breaker
    });

  // 3. Filter and normalize consumer bids
  const activeBids = (requests || [])
    .filter((r) => {
      const req = Number(r.requested_energy_kwh ?? r.requestedKwh ?? 0);
      return req > 0;
    })
    .map((r) => {
      const maxPrice = Number(r.max_acceptable_price ?? r.maxPrice ?? r.maxPriceEth ?? Infinity);
      return {
        id: r.id,
        consumerId: r.consumer_id ?? r.consumerId,
        requestedKwh: Number(r.requested_energy_kwh ?? r.requestedKwh),
        remainingKwh: Number(r.requested_energy_kwh ?? r.requestedKwh),
        maxPricePerKwh: isNaN(maxPrice) ? Infinity : maxPrice,
        priorityWeight: Number(r.priority_weight ?? r.priorityWeight ?? 1.0),
        createdAt: r.created_at ?? r.createdAt ?? new Date(0),
      };
    })
    // Rank bids descending by willingness-to-pay and priority weight
    .sort((a, b) => {
      if (a.maxPricePerKwh !== b.maxPricePerKwh && a.maxPricePerKwh !== Infinity && b.maxPricePerKwh !== Infinity) {
        return b.maxPricePerKwh - a.maxPricePerKwh; // Highest bid price first
      }
      if (b.priorityWeight !== a.priorityWeight) {
        return b.priorityWeight - a.priorityWeight; // Higher priority weight first
      }
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) return timeA - timeB; // Earlier request first
      return String(a.id).localeCompare(String(b.id));
    });

  const matches = [];
  let askIdx = 0;
  let bidIdx = 0;

  // 4. Greedy double-auction matching
  while (askIdx < activeAsks.length && bidIdx < activeBids.length) {
    const ask = activeAsks[askIdx];
    const bid = activeBids[bidIdx];

    // Prevent producers purchasing own listings
    if (String(ask.producerId) === String(bid.consumerId)) {
      bidIdx++;
      continue;
    }

    // Check price compatibility: consumer bid must meet or exceed producer ask
    if (bid.maxPricePerKwh < ask.pricePerKwh) {
      // Current bid cannot afford this cheapest ask
      bidIdx++;
      continue;
    }

    // Trade quantity is min of remaining ask capacity and remaining bid demand
    const tradeKwh = Math.min(ask.availableKwh, bid.remainingKwh);

    if (tradeKwh > 0.0001) {
      let clearingPrice = ask.pricePerKwh;
      if (pricingRule === "CONSUMER_BID" && bid.maxPricePerKwh !== Infinity) {
        clearingPrice = bid.maxPricePerKwh;
      } else if (pricingRule === "MIDPOINT" && bid.maxPricePerKwh !== Infinity) {
        clearingPrice = (ask.pricePerKwh + bid.maxPricePerKwh) / 2;
      }

      const totalCostEth = tradeKwh * clearingPrice;

      // Deterministic trade identifier
      const hashSeed = `MATCH_${ask.id}_${bid.id}_${tradeKwh.toFixed(4)}_${clearingPrice.toFixed(8)}`;
      const proposedTradeHash = "0x" + crypto.createHash("sha256").update(hashSeed).digest("hex");

      matches.push({
        proposedTradeHash,
        tradeHash: proposedTradeHash,
        listingId: ask.id,
        requestId: bid.id,
        producerId: ask.producerId,
        consumerId: bid.consumerId,
        energySource: ask.energySource,
        matchedKwh: Number(tradeKwh.toFixed(4)),
        energyAmountKwh: Number(tradeKwh.toFixed(4)),
        clearingPriceEth: Number(clearingPrice.toFixed(8)),
        unitPriceEth: Number(clearingPrice.toFixed(8)),
        totalCostEth: Number(totalCostEth.toFixed(8)),
        producerAskPrice: ask.pricePerKwh,
        consumerMaxPrice: bid.maxPricePerKwh === Infinity ? ask.pricePerKwh : bid.maxPricePerKwh,
        consumerBidPrice: bid.maxPricePerKwh === Infinity ? ask.pricePerKwh : bid.maxPricePerKwh,
        status: "PROPOSED",
      });

      ask.availableKwh -= tradeKwh;
      bid.remainingKwh -= tradeKwh;
    }

    if (ask.availableKwh <= 0.0001) {
      askIdx++;
    }
    if (bid.remainingKwh <= 0.0001) {
      bidIdx++;
    }
  }

  const elapsed = process.hrtime(startTime);
  const runtimeMs = elapsed[0] * 1000 + elapsed[1] / 1000000;

  const totalMatchedKwh = matches.reduce((sum, m) => sum + m.matchedKwh, 0);
  const totalTradingVolumeEth = matches.reduce((sum, m) => sum + m.totalCostEth, 0);

  return {
    matches,
    totalMatchedKwh: Number(totalMatchedKwh.toFixed(4)),
    totalMatchedEnergyKwh: Number(totalMatchedKwh.toFixed(4)),
    totalTradingVolumeEth: Number(totalTradingVolumeEth.toFixed(8)),
    totalTradeValueEth: Number(totalTradingVolumeEth.toFixed(8)),
    unmatchedListings: activeAsks.filter((a) => a.availableKwh > 0.0001),
    unmatchedRequests: activeBids.filter((b) => b.remainingKwh > 0.0001),
    unmatchedListingsCount: activeAsks.filter((a) => a.availableKwh > 0.0001).length,
    unmatchedRequestsCount: activeBids.filter((b) => b.remainingKwh > 0.0001).length,
    pricingRuleUsed: pricingRule,
    runtimeMs: Number(runtimeMs.toFixed(3)),
  };
}

module.exports = {
  matchOrdersGreedy,
};
