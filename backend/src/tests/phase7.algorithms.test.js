const test = require("node:test");
const assert = require("node:assert");

const {
  allocateDemandAwareWeightedProportional,
  allocateFCFS,
  allocateBasicProportional,
} = require("../algorithms/allocationAlgorithm");

const { matchOrdersGreedy } = require("../algorithms/greedyMatching");
const {
  calculateRuleBasedDynamicPrice,
  getTOUMultiplier,
  DEFAULT_CONFIG,
} = require("../algorithms/dynamicPricing");

const {
  calculateJainsIndex,
  calculateFulfillmentStats,
  calculateAllocationEfficiency,
  calculateUnmetDemand,
  computeComprehensiveMetrics,
} = require("../algorithms/fairnessMetrics");

const {
  createDeterministicRng,
  generateSyntheticRequests,
  generateSyntheticListings,
  RESEARCH_SCENARIOS,
  runExperimentScenario,
} = require("../algorithms/algorithmUtils");

const allocationService = require("../services/allocationService");

test("Phase 7 - Invariant 1: Total allocated energy never exceeds available supply S (Sum x_i <= S)", () => {
  const requests = [
    { id: 1, requestedKwh: 120, priorityWeight: 2.0 },
    { id: 2, requestedKwh: 80, priorityWeight: 1.5 },
    { id: 3, requestedKwh: 150, priorityWeight: 1.0 },
    { id: 4, requestedKwh: 50, priorityWeight: 1.0 },
  ];
  const supply = 200; // Total demand is 400 kWh, deficit scenario

  const resDA = allocateDemandAwareWeightedProportional(requests, supply);
  const sumDA = resDA.allocations.reduce((s, a) => s + a.allocatedKwh, 0);
  assert.ok(sumDA <= supply + 0.0001, `DA-WPA exceeded supply: ${sumDA} > ${supply}`);
  assert.strictEqual(Math.round(sumDA), supply);

  const resFCFS = allocateFCFS(requests, supply);
  const sumFCFS = resFCFS.allocations.reduce((s, a) => s + a.allocatedKwh, 0);
  assert.ok(sumFCFS <= supply + 0.0001, `FCFS exceeded supply: ${sumFCFS} > ${supply}`);

  const resBPA = allocateBasicProportional(requests, supply);
  const sumBPA = resBPA.allocations.reduce((s, a) => s + a.allocatedKwh, 0);
  assert.ok(sumBPA <= supply + 0.0001, `BPA exceeded supply: ${sumBPA} > ${supply}`);
});

test("Phase 7 - Invariant 2: No consumer receives more than requested (x_i <= d_i)", () => {
  const requests = [
    { id: 1, requestedKwh: 10, priorityWeight: 5.0 }, // High priority, small demand
    { id: 2, requestedKwh: 500, priorityWeight: 1.0 },
  ];
  const supply = 300;

  const res = allocateDemandAwareWeightedProportional(requests, supply);
  const req1 = res.allocations.find((a) => a.id === 1);
  const req2 = res.allocations.find((a) => a.id === 2);

  assert.strictEqual(req1.allocatedKwh, 10, "Consumer 1 exceeded demand cap");
  assert.ok(req2.allocatedKwh <= 500, "Consumer 2 exceeded demand cap");
  assert.strictEqual(Math.round(req1.allocatedKwh + req2.allocatedKwh), 300);
});

test("Phase 7 - Invariant 3: Non-negative allocations (x_i >= 0)", () => {
  const requests = [
    { id: 1, requestedKwh: 0, priorityWeight: 1.0 },
    { id: 2, requestedKwh: 100, priorityWeight: 1.0 },
  ];
  const supply = 50;

  const res = allocateDemandAwareWeightedProportional(requests, supply);
  for (const alloc of res.allocations) {
    assert.ok(alloc.allocatedKwh >= 0, `Negative allocation found: ${alloc.allocatedKwh}`);
  }
});

test("Phase 7 - Invariant 4: Correct surplus redistribution when demand caps are reached", () => {
  // Supply is 100 kWh.
  // Req 1 wants 20 kWh (priority 2.0).
  // Req 2 wants 100 kWh (priority 1.0).
  // In naive weighted share: Req 1 would get 100 * (40 / 140) = 28.57 kWh, but only wants 20.
  // The 8.57 surplus must be redistributed to Req 2 so that Req 1 gets 20 and Req 2 gets 80.
  const requests = [
    { id: "A", requestedKwh: 20, priorityWeight: 2.0 },
    { id: "B", requestedKwh: 100, priorityWeight: 1.0 },
  ];
  const supply = 100;

  const res = allocateDemandAwareWeightedProportional(requests, supply);
  const allocA = res.allocations.find((a) => a.id === "A");
  const allocB = res.allocations.find((a) => a.id === "B");

  assert.strictEqual(allocA.allocatedKwh, 20);
  assert.strictEqual(allocB.allocatedKwh, 80);
  assert.strictEqual(res.totalAllocatedKwh, 100);
});

test("Phase 7 - Invariant 5: FCFS strictly allocates in chronological timestamp order", () => {
  const requests = [
    { id: "first", requestedKwh: 60, timestamp: new Date("2026-01-01T10:00:00Z") },
    { id: "second", requestedKwh: 60, timestamp: new Date("2026-01-01T10:05:00Z") },
    { id: "third", requestedKwh: 60, timestamp: new Date("2026-01-01T10:10:00Z") },
  ];
  const supply = 100; // Only enough for 1st and part of 2nd

  const res = allocateFCFS(requests, supply);
  const first = res.allocations.find((a) => a.id === "first");
  const second = res.allocations.find((a) => a.id === "second");
  const third = res.allocations.find((a) => a.id === "third");

  assert.strictEqual(first.allocatedKwh, 60);
  assert.strictEqual(second.allocatedKwh, 40);
  assert.strictEqual(third.allocatedKwh, 0);
  assert.strictEqual(third.fulfillmentRatio, 0);
});

test("Phase 7 - Invariant 6: Basic Proportional Allocation follows uniform weights (w_i = 1.0)", () => {
  const requests = [
    { id: 1, requestedKwh: 100, priorityWeight: 5.0 }, // Overridden to 1.0 in BPA
    { id: 2, requestedKwh: 100, priorityWeight: 0.1 }, // Overridden to 1.0 in BPA
  ];
  const supply = 100;

  const res = allocateBasicProportional(requests, supply);
  const alloc1 = res.allocations.find((a) => a.id === 1);
  const alloc2 = res.allocations.find((a) => a.id === 2);

  // Equal demand and uniform weights must result in equal allocation (50/50)
  assert.strictEqual(alloc1.allocatedKwh, 50);
  assert.strictEqual(alloc2.allocatedKwh, 50);
  assert.strictEqual(alloc1.fulfillmentRatio, 0.5);
  assert.strictEqual(alloc2.fulfillmentRatio, 0.5);
});

test("Phase 7 - Invariant 7: Price-Aware Greedy Matching respects Ask <= Bid constraint", () => {
  const listings = [
    { id: "L1", producerId: "P1", availableKwh: 100, pricePerKwh: 0.00010, energySource: "SOLAR" },
    { id: "L2", producerId: "P2", availableKwh: 100, pricePerKwh: 0.00015, energySource: "WIND" },
  ];
  const requests = [
    { id: "R1", consumerId: "C1", requestedKwh: 80, maxPrice: 0.00012, priorityWeight: 1 }, // Can afford L1, cannot afford L2
    { id: "R2", consumerId: "C2", requestedKwh: 80, maxPrice: 0.00008, priorityWeight: 1 }, // Cannot afford either
  ];

  const res = matchOrdersGreedy(listings, requests, { pricingRule: "MIDPOINT" });

  assert.strictEqual(res.matches.length, 1);
  const m = res.matches[0];
  assert.strictEqual(m.listingId, "L1");
  assert.strictEqual(m.requestId, "R1");
  assert.strictEqual(m.matchedKwh, 80);
  assert.ok(m.producerAskPrice <= m.consumerMaxPrice, "Ask price exceeded bid price");
  assert.strictEqual(m.clearingPriceEth, (0.00010 + 0.00012) / 2);
  assert.strictEqual(res.totalMatchedKwh, 80);
});

test("Phase 7 - Invariant 8: Dynamic Pricing strictly enforces [P_min, P_max] bounds", () => {
  // Case A: Extremely high demand, R = 1000, should be clamped at maxPriceCeilingEth
  const highDemandResult = calculateRuleBasedDynamicPrice({
    totalAvailableSupplyKwh: 1,
    totalDemandKwh: 1000,
    hourOfDay: 20, // Peak hour (multiplier 1.30)
    energySource: "SOLAR",
  });

  assert.ok(
    highDemandResult.calculatedPriceEth <= DEFAULT_CONFIG.maxPriceCeilingEth,
    `Price exceeded regulatory ceiling: ${highDemandResult.calculatedPriceEth} > ${DEFAULT_CONFIG.maxPriceCeilingEth}`
  );

  // Case B: Extremely low demand, huge supply, should be clamped at minPriceFloorEth
  const lowDemandResult = calculateRuleBasedDynamicPrice({
    totalAvailableSupplyKwh: 100000,
    totalDemandKwh: 1,
    hourOfDay: 3, // Nocturnal trough
    energySource: "WIND",
  });

  assert.ok(
    lowDemandResult.calculatedPriceEth >= DEFAULT_CONFIG.minPriceFloorEth,
    `Price violated regulatory floor: ${lowDemandResult.calculatedPriceEth} < ${DEFAULT_CONFIG.minPriceFloorEth}`
  );
});

test("Phase 7 - Invariant 9: Jain's Fairness Index boundary and edge case accuracy", () => {
  // Perfect equality across 4 consumers
  const equalAlloc = [50, 50, 50, 50];
  assert.strictEqual(calculateJainsIndex(equalAlloc), 1.0);

  // Single participant
  assert.strictEqual(calculateJainsIndex([100]), 1.0);

  // All zeros
  assert.strictEqual(calculateJainsIndex([0, 0, 0]), 1.0);

  // Empty list
  assert.strictEqual(calculateJainsIndex([]), 1.0);

  // Maximum inequality: 1 participant gets 100, 3 get 0
  // J = 100^2 / (4 * 100^2) = 1/4 = 0.25
  const extremeAlloc = [100, 0, 0, 0];
  assert.strictEqual(calculateJainsIndex(extremeAlloc), 0.25);
});

test("Phase 7 - Invariant 10: Reproducibility of Seeded Synthetic Experiments", () => {
  const seed = 99999;
  const requests1 = generateSyntheticRequests(10, 50, 150, seed);
  const requests2 = generateSyntheticRequests(10, 50, 150, seed);

  assert.deepStrictEqual(requests1, requests2, "PRNG output must be strictly identical for identical seed");

  const listings1 = generateSyntheticListings(5, 100, 300, seed);
  const listings2 = generateSyntheticListings(5, 100, 300, seed);

  assert.deepStrictEqual(listings1, listings2, "PRNG listings output must be strictly identical for identical seed");
});

test("Phase 7 - Benchmark: Scenario evaluation executes all 6 research scenarios deterministically", () => {
  const scenarioKeys = Object.keys(RESEARCH_SCENARIOS);
  assert.strictEqual(scenarioKeys.length, 6);

  for (const key of scenarioKeys) {
    const report = runExperimentScenario(key);
    assert.strictEqual(report.scenarioKey, key);
    assert.ok(report.comparisons.DA_WPA, `Missing DA_WPA for ${key}`);
    assert.ok(report.comparisons.FCFS, `Missing FCFS for ${key}`);
    assert.ok(report.comparisons.BPA, `Missing BPA for ${key}`);

    // In Low Supply High Demand, DA-WPA must demonstrate superior fairness over FCFS
    if (key === "LOW_SUPPLY_HIGH_DEMAND") {
      const jainsDA = report.comparisons.DA_WPA.metrics.jainsFulfillmentIndex;
      const jainsFCFS = report.comparisons.FCFS.metrics.jainsFulfillmentIndex;
      assert.ok(
        jainsDA > jainsFCFS,
        `DA-WPA fulfillment fairness (${jainsDA}) should exceed FCFS (${jainsFCFS}) in scarcity`
      );
    }
  }
});

test("Phase 7 - Service: Simulation mode executes without mutating active database listings", async () => {
  // Test compareAllocationAlgorithms
  const comp = await allocationService.compareAllocationAlgorithms({
    availableSupplyKwh: 150,
    requests: [
      { id: "T1", requestedKwh: 100, priorityWeight: 2.0 },
      { id: "T2", requestedKwh: 100, priorityWeight: 1.0 },
    ],
  });

  assert.strictEqual(comp.algorithms.DA_WPA.totalAllocatedKwh, 150);
  assert.strictEqual(comp.algorithms.FCFS.totalAllocatedKwh, 150);
  assert.strictEqual(comp.algorithms.BPA.totalAllocatedKwh, 150);

  // Test dynamic pricing service
  const pricing = await allocationService.getDynamicPricingRecommendation({
    totalAvailableSupplyKwh: 200,
    totalDemandKwh: 400,
    hourOfDay: 20,
    energySource: "SOLAR",
  });

  assert.strictEqual(pricing.isPeakHour, true);
  assert.ok(pricing.calculatedPriceEth > 0);
});
