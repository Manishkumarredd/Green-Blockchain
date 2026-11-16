/**
 * GreenLedger Algorithm Utilities & Experimentation Framework
 * 
 * Provides deterministic pseudo-random generators, reproducible synthetic scenario builders,
 * and multi-algorithm benchmark harnesses comparing:
 * 1. FCFS (Baseline 1)
 * 2. Basic Proportional Allocation (Baseline 2)
 * 3. Demand-Aware Weighted Proportional Allocation (Proposed DA-WPA)
 */

const {
  allocateDemandAwareWeightedProportional,
  allocateFCFS,
  allocateBasicProportional,
} = require("./allocationAlgorithm");
const { matchOrdersGreedy } = require("./greedyMatching");
const { calculateRuleBasedDynamicPrice } = require("./dynamicPricing");

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Ensures 100% reproducible experiments with identical seed.
 */
function createSeededRandom(seed = 123456789) {
  let s = Math.floor(seed);
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Predefined Research Experiment Scenarios
 */
const RESEARCH_SCENARIOS = {
  LOW_SUPPLY_HIGH_DEMAND: {
    id: "LOW_SUPPLY_HIGH_DEMAND",
    name: "Scarcity Deficit: Low Supply & High Demand",
    description: "Evaluates algorithm behavior under severe renewable energy deficit (Supply: 250 kWh, Demand: 680 kWh).",
    totalSupplyKwh: 250,
    consumersCount: 8,
    seed: 101,
  },
  HIGH_SUPPLY_LOW_DEMAND: {
    id: "HIGH_SUPPLY_LOW_DEMAND",
    name: "Abundance Surplus: High Supply & Low Demand",
    description: "Evaluates algorithm behavior during peak renewable generation surplus (Supply: 1200 kWh, Demand: 450 kWh).",
    totalSupplyKwh: 1200,
    consumersCount: 6,
    seed: 202,
  },
  BALANCED_SUPPLY_DEMAND: {
    id: "BALANCED_SUPPLY_DEMAND",
    name: "Grid Equilibrium: Balanced Supply & Demand",
    description: "Tests performance when aggregate generation closely mirrors total consumer requests (Supply: 500 kWh, Demand: 510 kWh).",
    totalSupplyKwh: 500,
    consumersCount: 7,
    seed: 303,
  },
  UNEQUAL_CONSUMER_REQUESTS: {
    id: "UNEQUAL_CONSUMER_REQUESTS",
    name: "Disparate Demands: Critical Hospital vs Residential",
    description: "Tests fairness preservation when high-priority critical consumers (ICU) compete against standard residential demands.",
    totalSupplyKwh: 400,
    consumersCount: 10,
    seed: 404,
  },
  MULTI_PRODUCER_DIVERSE_PRICING: {
    id: "MULTI_PRODUCER_DIVERSE_PRICING",
    name: "Merit-Order Double Auction: Diverse Renewable Mix",
    description: "Combines Solar, Wind, and Hydro producers with varying marginal tariffs and consumer willingness-to-pay.",
    totalSupplyKwh: 750,
    consumersCount: 12,
    seed: 505,
  },
  SCALABILITY_STRESS_TEST: {
    id: "SCALABILITY_STRESS_TEST",
    name: "Microgrid Scale Test: 50 Distributed Prosumers",
    description: "Evaluates algorithmic computational overhead and algorithmic stability under high concurrency (50 consumers, 10 listings).",
    totalSupplyKwh: 2500,
    consumersCount: 50,
    seed: 606,
  },
};

/**
 * Generate synthetic deterministic requests using fixed random seed
 */
function generateSyntheticRequests(count = 8, seed = 12345) {
  const rng = createSeededRandom(seed);
  const priorityTiers = [
    { weight: 2.0, tier: "CRITICAL", label: "Hospital ICU / Cold Storage" },
    { weight: 1.5, tier: "COMMERCIAL", label: "Data Center / EV Fleet" },
    { weight: 1.0, tier: "STANDARD", label: "Residential Microgrid Node" },
  ];

  const requests = [];
  const baseTime = new Date("2026-11-16T10:00:00Z").getTime();

  for (let i = 1; i <= count; i++) {
    const tierIdx = Math.floor(rng() * priorityTiers.length);
    const tier = priorityTiers[tierIdx];
    // Demand between 20 kWh and 150 kWh
    const requestedKwh = Math.round((20 + rng() * 130) * 10) / 10;
    // Price between 0.000085 and 0.000140 ETH
    const maxPrice = 0.000085 + rng() * 0.000055;
    const timestamp = new Date(baseTime + i * 60000); // 1-minute sequential intervals

    requests.push({
      id: i,
      consumerId: 100 + i,
      consumerName: `Consumer ${i} (${tier.tier})`,
      requestedKwh,
      priorityWeight: tier.weight,
      priorityTier: tier.tier,
      maxPriceEth: Number(maxPrice.toFixed(8)),
      timestamp,
    });
  }

  return requests;
}

/**
 * Generate synthetic deterministic producer listings
 */
function generateSyntheticListings(count = 4, totalSupplyKwh = 500, seed = 54321) {
  const rng = createSeededRandom(seed);
  const sources = ["SOLAR", "WIND", "HYDRO", "BIOMASS"];
  const listings = [];
  let remainingSupply = totalSupplyKwh;

  for (let i = 1; i <= count; i++) {
    const source = sources[(i - 1) % sources.length];
    const isLast = i === count;
    const portion = isLast ? remainingSupply : Math.round((remainingSupply / (count - i + 1)) * (0.8 + rng() * 0.4) * 10) / 10;
    const capacity = Math.min(remainingSupply, Math.max(10, portion));
    remainingSupply = Math.max(0, remainingSupply - capacity);

    // Ask price between 0.000075 and 0.000098 ETH
    const askPrice = 0.000075 + rng() * 0.000023;

    listings.push({
      id: i,
      producerId: 200 + i,
      producerName: `Producer ${i} (${source})`,
      energySource: source,
      totalKwh: capacity,
      availableKwh: capacity,
      unitPriceEth: Number(askPrice.toFixed(8)),
      createdAt: new Date("2026-11-16T08:00:00Z"),
    });
  }

  return listings;
}

/**
 * Execute a complete reproducible research experiment
 * Runs FCFS, Basic Proportional, and Proposed Weighted Proportional on identical inputs.
 */
function runExperimentScenario(scenarioKey = "LOW_SUPPLY_HIGH_DEMAND", customOverrides = {}) {
  const scenarioDef = RESEARCH_SCENARIOS[scenarioKey] || RESEARCH_SCENARIOS.LOW_SUPPLY_HIGH_DEMAND;
  const config = { ...scenarioDef, ...customOverrides };

  // 1. Generate identical dataset
  const requests = generateSyntheticRequests(config.consumersCount, config.seed);
  const listings = generateSyntheticListings(4, config.totalSupplyKwh, config.seed + 999);
  const totalRequestedDemand = requests.reduce((sum, r) => sum + r.requestedKwh, 0);

  // 2. Execute Baseline 1: First-Come, First-Served (FCFS)
  const fcfsResult = allocateFCFS(requests, config.totalSupplyKwh);

  // 3. Execute Baseline 2: Basic Proportional Allocation (BPA)
  const bpaResult = allocateBasicProportional(requests, config.totalSupplyKwh);

  // 4. Execute Proposed Algorithm: Demand-Aware Weighted Proportional Allocation (DA-WPA)
  const proposedResult = allocateDemandAwareWeightedProportional(requests, config.totalSupplyKwh);

  // 5. Execute Greedy Double-Auction Matching
  const matchingResult = matchOrdersGreedy(listings, requests);

  // 6. Execute Dynamic Pricing Model
  const pricingResult = calculateRuleBasedDynamicPrice({
    totalAvailableSupplyKwh: config.totalSupplyKwh,
    totalDemandKwh: totalRequestedDemand,
    hourOfDay: 14,
    energySource: "SOLAR",
  });

  // 7. Structured Comparison Table
  const comparisonTable = [
    {
      metric: "Jain's Fairness Index",
      fcfs: fcfsResult.metrics.jainsFulfillmentIndex,
      basicProportional: bpaResult.metrics.jainsFulfillmentIndex,
      proposedAlgorithm: proposedResult.metrics.jainsFulfillmentIndex,
      unit: "Index (0-1)",
      interpretation: "Measures equality of demand fulfillment across consumers.",
    },
    {
      metric: "Overall Fulfillment Ratio",
      fcfs: fcfsResult.metrics.overallFulfillmentRatio,
      basicProportional: bpaResult.metrics.overallFulfillmentRatio,
      proposedAlgorithm: proposedResult.metrics.overallFulfillmentRatio,
      unit: "Ratio (0-1)",
      interpretation: "Fraction of aggregate demand fulfilled.",
    },
    {
      metric: "Minimum Fulfillment Ratio",
      fcfs: fcfsResult.metrics.minFulfillmentRatio,
      basicProportional: bpaResult.metrics.minFulfillmentRatio,
      proposedAlgorithm: proposedResult.metrics.minFulfillmentRatio,
      unit: "Ratio (0-1)",
      interpretation: "Worst-off consumer satisfaction rate.",
    },
    {
      metric: "Allocation Efficiency",
      fcfs: fcfsResult.metrics.allocationEfficiencyPct,
      basicProportional: bpaResult.metrics.allocationEfficiencyPct,
      proposedAlgorithm: proposedResult.metrics.allocationEfficiencyPct,
      unit: "%",
      interpretation: "Percentage of available green generation utilized.",
    },
    {
      metric: "Unmet Demand",
      fcfs: fcfsResult.metrics.unmetDemandKwh,
      basicProportional: bpaResult.metrics.unmetDemandKwh,
      proposedAlgorithm: proposedResult.metrics.unmetDemandKwh,
      unit: "kWh",
      interpretation: "Remaining unserved demand across the microgrid.",
    },
    {
      metric: "Computational Runtime",
      fcfs: fcfsResult.metrics.executionTimeMs,
      basicProportional: bpaResult.metrics.executionTimeMs,
      proposedAlgorithm: proposedResult.metrics.executionTimeMs,
      unit: "ms",
      interpretation: "Algorithm execution latency in milliseconds.",
    },
  ];

  return {
    scenario: {
      id: config.id,
      name: config.name,
      description: config.description,
      totalSupplyKwh: config.totalSupplyKwh,
      totalRequestedKwh: Number(totalRequestedDemand.toFixed(2)),
      consumersCount: requests.length,
      listingsCount: listings.length,
      seed: config.seed,
    },
    comparisonTable,
    algorithms: {
      fcfs: {
        name: "First-Come, First-Served",
        metrics: fcfsResult.metrics,
        allocations: fcfsResult.allocations,
      },
      basicProportional: {
        name: "Basic Proportional Allocation",
        metrics: bpaResult.metrics,
        allocations: bpaResult.allocations,
      },
      proposedAlgorithm: {
        name: "Demand-Aware Weighted Proportional (DA-WPA)",
        metrics: proposedResult.metrics,
        allocations: proposedResult.allocations,
      },
    },
    comparisons: {
      FCFS: {
        name: "First-Come, First-Served",
        metrics: fcfsResult.metrics,
        allocations: fcfsResult.allocations,
      },
      BPA: {
        name: "Basic Proportional Allocation",
        metrics: bpaResult.metrics,
        allocations: bpaResult.allocations,
      },
      DA_WPA: {
        name: "Demand-Aware Weighted Proportional (DA-WPA)",
        metrics: proposedResult.metrics,
        allocations: proposedResult.allocations,
      },
    },
    scenarioKey: config.id,
    matching: matchingResult,
    dynamicPricing: pricingResult,
    timestamp: new Date(),
  };
}

module.exports = {
  createSeededRandom,
  createDeterministicRng: createSeededRandom,
  RESEARCH_SCENARIOS,
  generateSyntheticRequests,
  generateSyntheticListings,
  runExperimentScenario,
};
