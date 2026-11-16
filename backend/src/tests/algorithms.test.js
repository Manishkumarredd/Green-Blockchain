const test = require("node:test");
const assert = require("node:assert");

const { allocateProportionally } = require("../algorithms/allocation");
const { matchOrdersGreedy } = require("../algorithms/matching");
const { calculateDynamicPrice, getTimeOfUseMultiplier } = require("../algorithms/pricing");
const { calculateCarbonSavings } = require("../algorithms/carbon");
const EnergySimulator = require("../services/energySimulator");

test("Allocation Algorithm: Demand-Aware Weighted Proportional Distribution", () => {
  const requests = [
    { id: "req-1", requestedKwh: 100, priorityWeight: 2.0 }, // Critical
    { id: "req-2", requestedKwh: 100, priorityWeight: 1.0 }, // Standard
  ];

  // Supply is 90 kWh (less than total 200 kWh)
  const result = allocateProportionally(requests, 90);

  assert.strictEqual(result.totalAllocatedKwh, 90);
  assert.strictEqual(result.unallocatedSupplyKwh, 0);

  // With weights 2:1 on equal demands, req-1 should receive 2/3 of 90 = 60 kWh, req-2 should receive 1/3 of 90 = 30 kWh
  const alloc1 = result.allocations.find(a => a.id === "req-1");
  const alloc2 = result.allocations.find(a => a.id === "req-2");

  assert.strictEqual(Math.round(alloc1.allocatedKwh), 60);
  assert.strictEqual(Math.round(alloc2.allocatedKwh), 30);
});

test("Matching Engine: Price-Aware Greedy Merit-Order Matching", () => {
  const listings = [
    { id: "list-1", producerId: "p1", availableKwh: 50, unitPriceEth: 0.00008, energySource: "SOLAR" },
    { id: "list-2", producerId: "p2", availableKwh: 50, unitPriceEth: 0.00010, energySource: "WIND" },
  ];

  const requests = [
    { id: "req-1", consumerId: "c1", requestedKwh: 40, maxPriceEth: 0.00012, priorityWeight: 1 },
    { id: "req-2", consumerId: "c2", requestedKwh: 50, maxPriceEth: 0.00009, priorityWeight: 1 },
  ];

  const result = matchOrdersGreedy(listings, requests, { pricingRule: "PRODUCER_ASK" });

  assert.strictEqual(result.matches.length, 2);
  // Total matched is 40 (req-1 with list-1) + 10 (req-2 with list-1) = 50 kWh.
  // req-2 cannot afford list-2 (0.00009 < 0.00010).
  assert.strictEqual(result.totalMatchedEnergyKwh, 50);
  assert.strictEqual(result.matches[0].producerId, "p1");
  assert.strictEqual(result.matches[0].consumerId, "c1");
});

test("Pricing Engine: Rule-Based Time-of-Use & Dynamic Pricing", () => {
  assert.strictEqual(getTimeOfUseMultiplier(20), 1.30); // Peak
  assert.strictEqual(getTimeOfUseMultiplier(3), 0.80);  // Off-peak
  assert.strictEqual(getTimeOfUseMultiplier(14), 1.00); // Standard

  const priceCalc = calculateDynamicPrice({
    totalSupplyKwh: 200,
    totalDemandKwh: 300,
    hourOfDay: 20, // Peak
    energySource: "SOLAR",
  });

  assert.strictEqual(priceCalc.isPeakHour, true);
  assert.strictEqual(priceCalc.touMultiplier, 1.30);
  assert.strictEqual(priceCalc.recommendedPriceEth > priceCalc.baseTariffEth, true);
});

test("Carbon Engine: Avoided Emissions Calculation", () => {
  const result = calculateCarbonSavings(100, "SOLAR");
  // 100 kWh * (0.820 - 0.041) = 77.9 kg CO2
  assert.strictEqual(result.carbonSavedKg, 77.9);
  assert.strictEqual(result.carbonSavedGrams, 77900);
  assert.strictEqual(result.equivalencies.treesPlantedEquivalentYear > 0, true);
});

test("Energy Simulator: Solar and Wind Physical Models", () => {
  const middaySolar = EnergySimulator.simulateSolar(100, 12, 0.0, 25);
  const midnightSolar = EnergySimulator.simulateSolar(100, 0, 0.0, 20);

  assert.strictEqual(middaySolar.outputKwh > 0, true);
  assert.strictEqual(midnightSolar.outputKwh, 0);

  const windNormal = EnergySimulator.simulateWind(100, 12);
  const windCalm = EnergySimulator.simulateWind(100, 2);

  assert.strictEqual(windNormal.outputKwh, 100);
  assert.strictEqual(windCalm.outputKwh, 0);
});
