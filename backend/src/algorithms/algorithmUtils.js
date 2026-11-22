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
 * All 8 Peer-Reviewed Research Benchmark Scenarios
 * Matches docs/EXPERIMENTAL_EVALUATION.md and scripts/run_research_experiments.js
 */
const RESEARCH_BENCHMARK_SCENARIOS = {
  SCENARIO_1_LOW_SUPPLY_HIGH_DEMAND: {
    id: "SCENARIO_1_LOW_SUPPLY_HIGH_DEMAND",
    alias: "LOW_SUPPLY_HIGH_DEMAND",
    name: "Scenario 1: Low Supply & High Demand (Scarcity Deficit)",
    description: "Supply is constrained at 250 kWh while 8 consumers demand 680+ kWh (Deficit Ratio: 2.72x).",
    totalSupplyKwh: 250,
    consumersCount: 8,
    seed: 101,
    generateRequests: (rng) => {
      const weights = [2.0, 1.5, 1.0, 1.0, 1.5, 2.0, 1.0, 1.0];
      const priorityTiers = ["CRITICAL", "COMMERCIAL", "STANDARD", "STANDARD", "COMMERCIAL", "CRITICAL", "STANDARD", "STANDARD"];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        consumerName: `Consumer ${i + 1} (${priorityTiers[i]})`,
        priorityTier: priorityTiers[i],
        requestedKwh: Math.round((50 + rng() * 70) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  SCENARIO_2_HIGH_SUPPLY_LOW_DEMAND: {
    id: "SCENARIO_2_HIGH_SUPPLY_LOW_DEMAND",
    alias: "HIGH_SUPPLY_LOW_DEMAND",
    name: "Scenario 2: High Supply & Low Demand (Abundance Surplus)",
    description: "Supply is abundant at 1,200 kWh while 6 consumers demand only 450 kWh (Surplus Ratio: 2.67x).",
    totalSupplyKwh: 1200,
    consumersCount: 6,
    seed: 202,
    generateRequests: (rng) => {
      const weights = [1.0, 1.5, 2.0, 1.0, 1.5, 1.0];
      const priorityTiers = ["STANDARD", "COMMERCIAL", "CRITICAL", "STANDARD", "COMMERCIAL", "STANDARD"];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        consumerName: `Consumer ${i + 1} (${priorityTiers[i]})`,
        priorityTier: priorityTiers[i],
        requestedKwh: Math.round((40 + rng() * 70) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  SCENARIO_3_BALANCED_SUPPLY_DEMAND: {
    id: "SCENARIO_3_BALANCED_SUPPLY_DEMAND",
    alias: "BALANCED_SUPPLY_DEMAND",
    name: "Scenario 3: Balanced Supply & Demand (Grid Equilibrium)",
    description: "Aggregate supply of 500 kWh closely mirrors total consumer demand of ~510 kWh.",
    totalSupplyKwh: 500,
    consumersCount: 7,
    seed: 303,
    generateRequests: (rng) => {
      const weights = [1.0, 1.5, 2.0, 1.0, 1.5, 1.0, 2.0];
      const priorityTiers = ["STANDARD", "COMMERCIAL", "CRITICAL", "STANDARD", "COMMERCIAL", "STANDARD", "CRITICAL"];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        consumerName: `Consumer ${i + 1} (${priorityTiers[i]})`,
        priorityTier: priorityTiers[i],
        requestedKwh: Math.round((45 + rng() * 50) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  SCENARIO_4_EQUAL_CONSUMER_DEMANDS: {
    id: "SCENARIO_4_EQUAL_CONSUMER_DEMANDS",
    alias: "EQUAL_CONSUMER_DEMANDS",
    name: "Scenario 4: Equal Consumer Demands (Homogeneous 60 kWh)",
    description: "10 consumers all request an identical 60 kWh with varied priority tiers under 400 kWh total supply.",
    totalSupplyKwh: 400,
    consumersCount: 10,
    seed: 404,
    generateRequests: () => {
      const weights = [2.0, 2.0, 1.5, 1.5, 1.5, 1.0, 1.0, 1.0, 1.0, 1.0];
      const priorityTiers = ["CRITICAL", "CRITICAL", "COMMERCIAL", "COMMERCIAL", "COMMERCIAL", "STANDARD", "STANDARD", "STANDARD", "STANDARD", "STANDARD"];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        consumerName: `Consumer ${i + 1} (${priorityTiers[i]})`,
        priorityTier: priorityTiers[i],
        requestedKwh: 60.0,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  SCENARIO_5_HIGHLY_UNEQUAL_DEMANDS: {
    id: "SCENARIO_5_HIGHLY_UNEQUAL_DEMANDS",
    alias: "UNEQUAL_CONSUMER_REQUESTS",
    name: "Scenario 5: Highly Unequal Demands (Hospital vs Residential)",
    description: "Demands range from 15 kWh to 280 kWh (Large Hospital vs Small Home) under 500 kWh supply.",
    totalSupplyKwh: 500,
    consumersCount: 8,
    seed: 505,
    generateRequests: () => {
      const specs = [
        { kwh: 280, weight: 2.0, tier: "CRITICAL", name: "Regional Hospital ICU" },
        { kwh: 180, weight: 1.5, tier: "COMMERCIAL", name: "Cloud Data Center" },
        { kwh: 90,  weight: 1.0, tier: "COMMERCIAL", name: "Commercial Office Park" },
        { kwh: 45,  weight: 1.0, tier: "STANDARD", name: "Apartment Complex A" },
        { kwh: 30,  weight: 1.0, tier: "STANDARD", name: "Retail Shopping Store" },
        { kwh: 25,  weight: 1.0, tier: "STANDARD", name: "EV Fast Charging Depot" },
        { kwh: 20,  weight: 1.0, tier: "STANDARD", name: "Neighborhood Bakery" },
        { kwh: 15,  weight: 1.0, tier: "STANDARD", name: "Single Residential Home" },
      ];
      return specs.map((s, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        consumerName: s.name,
        priorityTier: s.tier,
        requestedKwh: s.kwh,
        priorityWeight: s.weight,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  SCENARIO_6_EXTREME_PRIORITY_WEIGHTS: {
    id: "SCENARIO_6_EXTREME_PRIORITY_WEIGHTS",
    alias: "EXTREME_PRIORITY_WEIGHTS",
    name: "Scenario 6: Extreme Priority Weights (5.0x to 0.5x)",
    description: "Evaluates algorithm sensitivity with wide priority spread (Critical 5.0x vs Low 0.5x).",
    totalSupplyKwh: 350,
    consumersCount: 8,
    seed: 606,
    generateRequests: (rng) => {
      const weights = [5.0, 4.0, 3.0, 2.0, 1.5, 1.0, 1.0, 0.5];
      const priorityTiers = ["CRITICAL", "CRITICAL", "CRITICAL", "COMMERCIAL", "COMMERCIAL", "STANDARD", "STANDARD", "STANDARD"];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        consumerName: `Consumer ${i + 1} (${weights[i]}x)`,
        priorityTier: priorityTiers[i],
        requestedKwh: Math.round((40 + rng() * 60) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  SCENARIO_7_SCALABILITY_CONSUMERS: {
    id: "SCENARIO_7_SCALABILITY_CONSUMERS",
    alias: "SCALABILITY_STRESS_TEST",
    name: "Scenario 7: Increasing Consumer Population (50 Nodes)",
    description: "Evaluates algorithmic computational overhead and stability under 50 concurrent prosumers.",
    totalSupplyKwh: 2000,
    consumersCount: 50,
    seed: 707,
    generateRequests: (rng) => {
      const requests = [];
      for (let i = 1; i <= 50; i++) {
        const w = (i % 5 === 0) ? 2.0 : (i % 2 === 0 ? 1.5 : 1.0);
        const tier = w === 2.0 ? "CRITICAL" : w === 1.5 ? "COMMERCIAL" : "STANDARD";
        requests.push({
          id: i,
          consumerId: 100 + i,
          consumerName: `Microgrid Node ${i} (${tier})`,
          priorityTier: tier,
          requestedKwh: Math.round((25 + rng() * 55) * 10) / 10,
          priorityWeight: w,
          timestamp: new Date(1763287200000 + i * 30000),
        });
      }
      return requests;
    },
  },
  SCENARIO_8_SCALABILITY_LISTINGS: {
    id: "SCENARIO_8_SCALABILITY_LISTINGS",
    alias: "MULTI_PRODUCER_DIVERSE_PRICING",
    name: "Scenario 8: Multi-Producer Double-Auction Diversity",
    description: "Tests merit-order double-auction matching with 12 consumer bids and 4 diverse producers.",
    totalSupplyKwh: 750,
    consumersCount: 12,
    seed: 808,
    generateRequests: (rng) => {
      const requests = [];
      for (let i = 1; i <= 12; i++) {
        const w = (i % 3 === 0) ? 2.0 : (i % 2 === 0 ? 1.5 : 1.0);
        const tier = w === 2.0 ? "CRITICAL" : w === 1.5 ? "COMMERCIAL" : "STANDARD";
        requests.push({
          id: i,
          consumerId: 100 + i,
          consumerName: `Consumer ${i} (${tier})`,
          priorityTier: tier,
          requestedKwh: Math.round((30 + rng() * 60) * 10) / 10,
          priorityWeight: w,
          maxPriceEth: Number((0.000085 + rng() * 0.000055).toFixed(8)),
          timestamp: new Date(1763287200000 + i * 45000),
        });
      }
      return requests;
    },
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
  const scenarioDef =
    RESEARCH_SCENARIOS[scenarioKey] ||
    RESEARCH_BENCHMARK_SCENARIOS[scenarioKey] ||
    Object.values(RESEARCH_BENCHMARK_SCENARIOS).find((s) => s.alias === scenarioKey) ||
    RESEARCH_SCENARIOS.LOW_SUPPLY_HIGH_DEMAND;
  const config = { ...scenarioDef, ...customOverrides };

  // 1. Generate identical dataset
  const requests =
    typeof config.generateRequests === "function"
      ? config.generateRequests(createSeededRandom(config.seed))
      : generateSyntheticRequests(config.consumersCount, config.seed);
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
    scenarioKey: scenarioKey || config.id,
    matching: matchingResult,
    dynamicPricing: pricingResult,
    timestamp: new Date(),
  };
}

module.exports = {
  createSeededRandom,
  createDeterministicRng: createSeededRandom,
  RESEARCH_SCENARIOS,
  RESEARCH_BENCHMARK_SCENARIOS,
  generateSyntheticRequests,
  generateSyntheticListings,
  runExperimentScenario,
};
