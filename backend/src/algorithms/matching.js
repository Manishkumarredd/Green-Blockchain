const crypto = require("crypto");

/**
 * Price-Aware Greedy Energy Matching Engine
 * 
 * Implements a double-auction merit-order greedy matching mechanism:
 * 1. Sorts Producer Listings (asks) ascending by price (cheapest green electricity first).
 * 2. Sorts Consumer Requests (bids) descending by price and priority weight.
 * 3. Greedily matches orders where Bid Price >= Ask Price.
 * 4. Determines the clearing price per match.
 * 5. Generates unique deterministic trade hashes for blockchain settlement.
 * 
 * Strictly deterministic and rule-based (No ML/DL).
 */

/**
 * @param {Array<{id: number|string, producerId: number|string, availableKwh: number, unitPriceEth: number, energySource: string}>} listings 
 * @param {Array<{id: number|string, consumerId: number|string, requestedKwh: number, maxPriceEth: number, priorityWeight: number}>} requests 
 * @param {object} options
 */
function matchOrdersGreedy(listings, requests, options = {}) {
  const pricingRule = options.pricingRule || "MIDPOINT"; // "PRODUCER_ASK", "CONSUMER_BID", or "MIDPOINT"

  // Deep clone and filter valid orders
  const asks = listings
    .filter(l => Number(l.availableKwh) > 0 && Number(l.unitPriceEth) > 0)
    .map(l => ({
      ...l,
      availableKwh: Number(l.availableKwh),
      unitPriceEth: Number(l.unitPriceEth),
    }))
    .sort((a, b) => a.unitPriceEth - b.unitPriceEth); // Ascending by price

  const bids = requests
    .filter(r => Number(r.requestedKwh) > 0 && Number(r.maxPriceEth) > 0)
    .map(r => ({
      ...r,
      requestedKwh: Number(r.requestedKwh),
      remainingKwh: Number(r.requestedKwh),
      maxPriceEth: Number(r.maxPriceEth),
      priorityWeight: Number(r.priorityWeight || 1.0),
    }))
    .sort((a, b) => {
      if (b.maxPriceEth !== a.maxPriceEth) {
        return b.maxPriceEth - a.maxPriceEth; // Descending by max price
      }
      return b.priorityWeight - a.priorityWeight; // Priority tie-breaker
    });

  const matches = [];
  let askIndex = 0;
  let bidIndex = 0;

  while (askIndex < asks.length && bidIndex < bids.length) {
    const currentAsk = asks[askIndex];
    const currentBid = bids[bidIndex];

    // Check price compatibility
    if (currentBid.maxPriceEth < currentAsk.unitPriceEth) {
      // Current bid cannot afford the cheapest available ask.
      // Since bids are descending, no subsequent bids can afford it either.
      bidIndex++;
      continue;
    }

    // Trade quantity is the minimum of remaining ask and bid
    const tradeVolume = Math.min(currentAsk.availableKwh, currentBid.remainingKwh);

    if (tradeVolume > 0.0001) {
      // Calculate clearing price
      let clearingPrice;
      if (pricingRule === "PRODUCER_ASK") {
        clearingPrice = currentAsk.unitPriceEth;
      } else if (pricingRule === "CONSUMER_BID") {
        clearingPrice = currentBid.maxPriceEth;
      } else {
        // MIDPOINT
        clearingPrice = (currentAsk.unitPriceEth + currentBid.maxPriceEth) / 2;
      }

      const totalCostEth = tradeVolume * clearingPrice;

      // Unique deterministic trade hash for on-chain settlement
      const seed = `MATCH_${currentAsk.id}_${currentBid.id}_${tradeVolume}_${Date.now()}_${Math.random()}`;
      const tradeHash = "0x" + crypto.createHash("sha256").update(seed).digest("hex");

      matches.push({
        tradeHash,
        listingId: currentAsk.id,
        requestId: currentBid.id,
        producerId: currentAsk.producerId,
        consumerId: currentBid.consumerId,
        energySource: currentAsk.energySource || "SOLAR",
        energyAmountKwh: Number(tradeVolume.toFixed(4)),
        unitPriceEth: Number(clearingPrice.toFixed(8)),
        totalCostEth: Number(totalCostEth.toFixed(8)),
        producerAskPrice: currentAsk.unitPriceEth,
        consumerBidPrice: currentBid.maxPriceEth,
      });

      // Update remaining amounts
      currentAsk.availableKwh -= tradeVolume;
      currentBid.remainingKwh -= tradeVolume;
    }

    if (currentAsk.availableKwh <= 0.0001) {
      askIndex++;
    }
    if (currentBid.remainingKwh <= 0.0001) {
      bidIndex++;
    }
  }

  const totalMatchedEnergy = matches.reduce((sum, m) => sum + m.energyAmountKwh, 0);
  const totalTradeValueEth = matches.reduce((sum, m) => sum + m.totalCostEth, 0);

  return {
    matches,
    totalMatchedEnergyKwh: Number(totalMatchedEnergy.toFixed(4)),
    totalTradeValueEth: Number(totalTradeValueEth.toFixed(8)),
    unmatchedListings: asks.filter(a => a.availableKwh > 0.0001),
    unmatchedRequests: bids.filter(b => b.remainingKwh > 0.0001),
  };
}

module.exports = {
  matchOrdersGreedy,
};
