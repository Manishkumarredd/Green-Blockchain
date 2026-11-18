/**
 * GreenLedger Phase 11 - Research Experimentation & Performance Benchmark Suite
 * 
 * Executes rigorous, reproducible experimental trials across 8 distinct research scenarios.
 * Compares:
 *   1. First-Come, First-Served (FCFS)
 *   2. Basic Proportional Allocation (BPA)
 *   3. Demand-Aware Weighted Proportional Allocation (DA-WPA - Proposed)
 * 
 * Records exact values for:
 *   - Jain's Fairness Index
 *   - Overall Fulfillment Ratio
 *   - Minimum Consumer Fulfillment
 *   - Allocation Efficiency (%)
 *   - Unmet Demand (kWh)
 *   - Average Fulfillment
 *   - Algorithm Runtime (ms)
 *   - Total Energy Allocated (kWh)
 * 
 * Also measures Greedy Matching & Dynamic Pricing performance,
 * as well as scalability profiles up to 200 consumers and 50 listings.
 */

const fs = require("fs");
const path = require("path");

const {
  allocateDemandAwareWeightedProportional,
  allocateFCFS,
  allocateBasicProportional,
} = require("../backend/src/algorithms/allocationAlgorithm");

const { matchOrdersGreedy } = require("../backend/src/algorithms/greedyMatching");
const { calculateRuleBasedDynamicPrice } = require("../backend/src/algorithms/dynamicPricing");
const { createSeededRandom } = require("../backend/src/algorithms/algorithmUtils");

// 8 Research Scenarios
const EXPERIMENTAL_SCENARIOS = [
  {
    id: "SCENARIO_1_LOW_SUPPLY_HIGH_DEMAND",
    name: "Scenario 1: Low Energy Supply & High Demand (Scarcity Deficit)",
    description: "Supply is constrained at 250 kWh while 8 consumers demand 680 kWh (Deficit Ratio: 2.72x).",
    totalSupplyKwh: 250,
    consumersCount: 8,
    seed: 101,
    generateRequests: (rng) => {
      const weights = [2.0, 1.5, 1.0, 1.0, 1.5, 2.0, 1.0, 1.0];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        requestedKwh: Math.round((50 + rng() * 70) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  {
    id: "SCENARIO_2_HIGH_SUPPLY_LOW_DEMAND",
    name: "Scenario 2: High Energy Supply & Low Demand (Abundance Surplus)",
    description: "Supply is abundant at 1,200 kWh while 6 consumers demand only 450 kWh (Surplus Ratio: 2.67x).",
    totalSupplyKwh: 1200,
    consumersCount: 6,
    seed: 202,
    generateRequests: (rng) => {
      const weights = [1.0, 1.5, 2.0, 1.0, 1.5, 1.0];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        requestedKwh: Math.round((40 + rng() * 70) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  {
    id: "SCENARIO_3_BALANCED_SUPPLY_DEMAND",
    name: "Scenario 3: Balanced Supply & Demand (Grid Equilibrium)",
    description: "Aggregate supply of 500 kWh closely mirrors total consumer demand of ~500 kWh.",
    totalSupplyKwh: 500,
    consumersCount: 7,
    seed: 303,
    generateRequests: (rng) => {
      const weights = [1.0, 1.5, 2.0, 1.0, 1.5, 1.0, 2.0];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        requestedKwh: Math.round((45 + rng() * 50) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  {
    id: "SCENARIO_4_EQUAL_CONSUMER_DEMANDS",
    name: "Scenario 4: Equal Consumer Demands (Homogeneous)",
    description: "10 consumers all request an identical 60 kWh with varied priority tiers under 400 kWh total supply.",
    totalSupplyKwh: 400,
    consumersCount: 10,
    seed: 404,
    generateRequests: () => {
      const weights = [2.0, 2.0, 1.5, 1.5, 1.5, 1.0, 1.0, 1.0, 1.0, 1.0];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        requestedKwh: 60.0,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  {
    id: "SCENARIO_5_HIGHLY_UNEQUAL_DEMANDS",
    name: "Scenario 5: Highly Unequal Consumer Demands (Disparate)",
    description: "Demands range from 15 kWh to 280 kWh (Large Hospital vs Small Home) under 500 kWh supply.",
    totalSupplyKwh: 500,
    consumersCount: 8,
    seed: 505,
    generateRequests: () => {
      const specs = [
        { kwh: 280, weight: 2.0 }, // Regional Hospital
        { kwh: 180, weight: 1.5 }, // Data Center
        { kwh: 90,  weight: 1.0 }, // Commercial Complex
        { kwh: 45,  weight: 1.0 }, // Apartment Block
        { kwh: 30,  weight: 1.0 }, // Retail Store
        { kwh: 25,  weight: 1.0 }, // EV Charger
        { kwh: 20,  weight: 1.0 }, // Small Business
        { kwh: 15,  weight: 1.0 }, // Single Residential Home
      ];
      return specs.map((s, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        requestedKwh: s.kwh,
        priorityWeight: s.weight,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  {
    id: "SCENARIO_6_EXTREME_PRIORITY_WEIGHTS",
    name: "Scenario 6: Different Priority Weight Configurations",
    description: "Evaluates algorithm sensitivity with extreme priority weighting (Critical 5.0x vs Standard 1.0x).",
    totalSupplyKwh: 350,
    consumersCount: 8,
    seed: 606,
    generateRequests: (rng) => {
      const weights = [5.0, 4.0, 3.0, 2.0, 1.5, 1.0, 1.0, 0.5];
      return weights.map((w, i) => ({
        id: i + 1,
        consumerId: 100 + i + 1,
        requestedKwh: Math.round((40 + rng() * 60) * 10) / 10,
        priorityWeight: w,
        timestamp: new Date(1763287200000 + i * 60000),
      }));
    },
  },
  {
    id: "SCENARIO_7_SCALABILITY_CONSUMERS",
    name: "Scenario 7: Increasing Consumer Population (Scalability)",
    description: "Tests microgrid scaling from 10 to 200 concurrent consumer requests under proportional supply.",
    isMultiScale: true,
    scales: [10, 25, 50, 100, 200],
    seed: 707,
  },
  {
    id: "SCENARIO_8_SCALABILITY_LISTINGS",
    name: "Scenario 8: Increasing Producer Listing Count (Scalability)",
    description: "Tests greedy double-auction matching scaling from 5 to 50 active listings with 100 consumer bids.",
    isListingScale: true,
    scales: [5, 10, 20, 35, 50],
    seed: 808,
  },
];

// Helper to time execution over multiple iterations for statistical stability
function benchmarkExecution(fn, iterations = 100) {
  // Warmup
  for (let i = 0; i < 10; i++) fn();
  const start = process.hrtime();
  let lastResult = null;
  for (let i = 0; i < iterations; i++) {
    lastResult = fn();
  }
  const diff = process.hrtime(start);
  const totalMs = diff[0] * 1000 + diff[1] / 1000000;
  const avgMs = totalMs / iterations;
  return { result: lastResult, avgMs: Number(avgMs.toFixed(4)) };
}

function runAllExperiments() {
  console.log("================================================================================");
  console.log("GREENLEDGER PHASE 11: RESEARCH ALGORITHM VALIDATION & PERFORMANCE EVALUATION");
  console.log("================================================================================");

  const scenarioResults = [];

  for (const scenario of EXPERIMENTAL_SCENARIOS) {
    console.log(`\nExecuting ${scenario.name}...`);
    const rng = createSeededRandom(scenario.seed);

    if (scenario.isMultiScale) {
      // Consumer scaling test
      const scaleRuns = [];
      for (const count of scenario.scales) {
        const supply = count * 40; // 40 kWh supply per consumer on average
        const reqRng = createSeededRandom(scenario.seed + count);
        const requests = [];
        for (let i = 1; i <= count; i++) {
          requests.push({
            id: i,
            consumerId: 100 + i,
            requestedKwh: Math.round((30 + reqRng() * 50) * 10) / 10,
            priorityWeight: (i % 3 === 0) ? 2.0 : (i % 2 === 0 ? 1.5 : 1.0),
            timestamp: new Date(1763287200000 + i * 1000),
          });
        }

        const bDA = benchmarkExecution(() => allocateDemandAwareWeightedProportional(requests, supply), 50);
        const bFCFS = benchmarkExecution(() => allocateFCFS(requests, supply), 50);
        const bBPA = benchmarkExecution(() => allocateBasicProportional(requests, supply), 50);

        scaleRuns.push({
          consumerCount: count,
          totalSupplyKwh: supply,
          totalDemandKwh: requests.reduce((s, r) => s + r.requestedKwh, 0),
          runtimeMs: {
            fcfs: bFCFS.avgMs,
            bpa: bBPA.avgMs,
            daWpa: bDA.avgMs,
          },
          jainsIndex: {
            fcfs: bFCFS.result.metrics.jainsFulfillmentIndex,
            bpa: bBPA.result.metrics.jainsFulfillmentIndex,
            daWpa: bDA.result.metrics.jainsFulfillmentIndex,
          },
          minFulfillment: {
            fcfs: bFCFS.result.metrics.minFulfillmentRatio,
            bpa: bBPA.result.metrics.minFulfillmentRatio,
            daWpa: bDA.result.metrics.minFulfillmentRatio,
          },
        });
      }
      scenarioResults.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        type: "CONSUMER_SCALABILITY",
        data: scaleRuns,
      });
      continue;
    }

    if (scenario.isListingScale) {
      // Listing scale test with greedy matching
      const listingRuns = [];
      const consumerCount = 100;
      const reqRng = createSeededRandom(scenario.seed);
      const requests = [];
      for (let i = 1; i <= consumerCount; i++) {
        requests.push({
          id: i,
          consumerId: 100 + i,
          requestedKwh: 35.0,
          maxPriceEth: 0.000100 + reqRng() * 0.000030,
        });
      }

      for (const count of scenario.scales) {
        const listRng = createSeededRandom(scenario.seed + count);
        const listings = [];
        for (let j = 1; j <= count; j++) {
          listings.push({
            id: j,
            producerId: 200 + j,
            availableKwh: 100.0,
            unitPriceEth: 0.000075 + listRng() * 0.000025,
            energySource: j % 2 === 0 ? "SOLAR" : "WIND",
          });
        }

        const bMatch = benchmarkExecution(() => matchOrdersGreedy(listings, requests), 50);
        listingRuns.push({
          listingsCount: count,
          consumersCount: consumerCount,
          runtimeMs: bMatch.avgMs,
          matchedTradesCount: bMatch.result.trades ? bMatch.result.trades.length : 0,
          totalMatchedKwh: bMatch.result.totalMatchedKwh,
        });
      }
      scenarioResults.push({
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        type: "LISTING_SCALABILITY",
        data: listingRuns,
      });
      continue;
    }

    // Standard Scenario
    const requests = scenario.generateRequests(rng);
    const supply = scenario.totalSupplyKwh;
    const totalDemand = requests.reduce((s, r) => s + r.requestedKwh, 0);

    const bDA = benchmarkExecution(() => allocateDemandAwareWeightedProportional(requests, supply), 100);
    const bFCFS = benchmarkExecution(() => allocateFCFS(requests, supply), 100);
    const bBPA = benchmarkExecution(() => allocateBasicProportional(requests, supply), 100);

    const mDA = bDA.result.metrics;
    const mFCFS = bFCFS.result.metrics;
    const mBPA = bBPA.result.metrics;

    console.log(`  -> Total Supply: ${supply} kWh | Total Demand: ${totalDemand.toFixed(1)} kWh`);
    console.log(`  -> Jain's Fairness: FCFS=${mFCFS.jainsFulfillmentIndex} | BPA=${mBPA.jainsFulfillmentIndex} | DA-WPA=${mDA.jainsFulfillmentIndex}`);
    console.log(`  -> Min Fulfillment: FCFS=${mFCFS.minFulfillmentRatio} | BPA=${mBPA.minFulfillmentRatio} | DA-WPA=${mDA.minFulfillmentRatio}`);
    console.log(`  -> Runtime (ms):    FCFS=${bFCFS.avgMs}ms | BPA=${bBPA.avgMs}ms | DA-WPA=${bDA.avgMs}ms`);

    scenarioResults.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      description: scenario.description,
      type: "STANDARD_COMPARISON",
      totalSupplyKwh: supply,
      totalDemandKwh: Number(totalDemand.toFixed(2)),
      consumerCount: requests.length,
      metrics: {
        jainsIndex: {
          fcfs: mFCFS.jainsFulfillmentIndex,
          bpa: mBPA.jainsFulfillmentIndex,
          daWpa: mDA.jainsFulfillmentIndex,
        },
        overallFulfillment: {
          fcfs: mFCFS.overallFulfillmentRatio,
          bpa: mBPA.overallFulfillmentRatio,
          daWpa: mDA.overallFulfillmentRatio,
        },
        minFulfillment: {
          fcfs: mFCFS.minFulfillmentRatio,
          bpa: mBPA.minFulfillmentRatio,
          daWpa: mDA.minFulfillmentRatio,
        },
        allocationEfficiency: {
          fcfs: mFCFS.allocationEfficiencyPct,
          bpa: mBPA.allocationEfficiencyPct,
          daWpa: mDA.allocationEfficiencyPct,
        },
        unmetDemand: {
          fcfs: mFCFS.unmetDemandKwh,
          bpa: mBPA.unmetDemandKwh,
          daWpa: mDA.unmetDemandKwh,
        },
        averageFulfillment: {
          fcfs: mFCFS.averageFulfillmentRatio,
          bpa: mBPA.averageFulfillmentRatio,
          daWpa: mDA.averageFulfillmentRatio,
        },
        totalAllocatedKwh: {
          fcfs: mFCFS.totalAllocatedKwh,
          bpa: mBPA.totalAllocatedKwh,
          daWpa: mDA.totalAllocatedKwh,
        },
        runtimeMs: {
          fcfs: bFCFS.avgMs,
          bpa: bBPA.avgMs,
          daWpa: bDA.avgMs,
        },
      },
    });
  }

  // Measure dynamic pricing performance
  console.log("\nMeasuring Dynamic Pricing Engine Latency...");
  const bPricing = benchmarkExecution(() => {
    return calculateRuleBasedDynamicPrice({
      totalAvailableSupplyKwh: 500,
      totalDemandKwh: 650,
      hourOfDay: 14,
      energySource: "SOLAR",
    });
  }, 500);
  console.log(`  -> Dynamic Pricing Latency: ${bPricing.avgMs} ms per calculation`);

  const benchmarkSummary = {
    testEnvironment: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuCores: require("os").cpus().length,
      memoryTotalGb: (require("os").totalmem() / (1024 ** 3)).toFixed(2),
    },
    pricingBenchmark: {
      latencyMs: bPricing.avgMs,
      samplePrice: bPricing.result,
    },
    scenarios: scenarioResults,
    executedAt: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, "../docs/research_experiment_results.json");
  fs.writeFileSync(outputPath, JSON.stringify(benchmarkSummary, null, 2), "utf8");
  console.log(`\n>>> EXPERIMENT RESULTS RECORDED TO ${outputPath} <<<`);
  return benchmarkSummary;
}

if (require.main === module) {
  runAllExperiments();
}

module.exports = { runAllExperiments };
