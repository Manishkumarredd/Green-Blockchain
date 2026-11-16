/**
 * GreenLedger Fairness and Performance Metrics Module
 * 
 * Provides rigorous mathematical evaluations for energy allocation algorithms:
 * - Jain's Fairness Index (equality of allocation and fulfillment)
 * - Individual and Aggregate Fulfillment Ratios
 * - Allocation Efficiency (%)
 * - Unmet Energy Demand (kWh)
 * - Computational Runtime Analysis
 */

/**
 * Calculates Jain's Fairness Index:
 * J(x) = (sum(x_i))^2 / (n * sum(x_i^2))
 * 
 * Normalized between 1/n (worst-case inequality) and 1.0 (perfect equality).
 * 
 * @param {number[]} values Array of numerical values (allocations or fulfillment ratios)
 * @returns {number} Jain's index rounded to 4 decimal places
 */
function calculateJainsIndex(values) {
  if (!Array.isArray(values) || values.length === 0) return 1.0;
  const n = values.length;
  if (n === 1) return 1.0;

  const validValues = values.map((v) => Math.max(0, Number(v) || 0));
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  const sumSq = validValues.reduce((acc, val) => acc + val * val, 0);

  // If all values are 0, everyone received equal allocation (0) -> fairness index = 1.0
  if (sumSq === 0) return 1.0;

  const index = (sum * sum) / (n * sumSq);
  return Number(Math.min(1.0, Math.max(0.0, index)).toFixed(4));
}

/**
 * Calculates itemized and overall fulfillment ratios:
 * F_i = x_i / d_i
 * F = (sum x_i) / (sum d_i)
 * 
 * @param {Array<{requestedKwh: number, allocatedKwh: number}>} items
 */
function calculateFulfillmentStats(items) {
  if (!items || items.length === 0) {
    return {
      overallFulfillment: 0.0,
      averageFulfillment: 0.0,
      minFulfillment: 0.0,
      maxFulfillment: 0.0,
      ratios: [],
    };
  }

  let totalRequested = 0;
  let totalAllocated = 0;
  const ratios = [];

  for (const item of items) {
    const req = Math.max(0, Number(item.requestedKwh || 0));
    const alloc = Math.max(0, Number(item.allocatedKwh || 0));
    totalRequested += req;
    totalAllocated += alloc;

    const ratio = req > 0 ? Math.min(1.0, alloc / req) : 1.0;
    ratios.push(Number(ratio.toFixed(4)));
  }

  const overallFulfillment = totalRequested > 0 ? Number((totalAllocated / totalRequested).toFixed(4)) : 1.0;
  const averageFulfillment = ratios.length > 0 ? Number((ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(4)) : 0.0;
  const minFulfillment = ratios.length > 0 ? Math.min(...ratios) : 0.0;
  const maxFulfillment = ratios.length > 0 ? Math.max(...ratios) : 0.0;

  return {
    overallFulfillment,
    averageFulfillment,
    minFulfillment,
    maxFulfillment,
    ratios,
  };
}

/**
 * Calculates allocation efficiency percentage:
 * E = (Total Allocated Energy / Total Available Energy) * 100%
 */
function calculateAllocationEfficiency(totalAllocatedKwh, availableSupplyKwh) {
  const supply = Math.max(0, Number(availableSupplyKwh || 0));
  const allocated = Math.max(0, Number(totalAllocatedKwh || 0));
  if (supply === 0) return 100.0;
  const efficiency = (allocated / supply) * 100;
  return Number(Math.min(100.0, Math.max(0.0, efficiency)).toFixed(2));
}

/**
 * Calculates unmet energy demand:
 * U = sum(d_i - x_i)
 */
function calculateUnmetDemand(totalRequestedKwh, totalAllocatedKwh) {
  const req = Math.max(0, Number(totalRequestedKwh || 0));
  const alloc = Math.max(0, Number(totalAllocatedKwh || 0));
  return Number(Math.max(0, req - alloc).toFixed(4));
}

/**
 * Generates comprehensive performance and fairness metrics for an allocation cycle
 */
function computeComprehensiveMetrics({
  allocations = [],
  availableSupplyKwh = 0,
  executionTimeMs = 0,
  matchesCount = 0,
}) {
  const totalRequested = allocations.reduce((sum, a) => sum + Number(a.requestedKwh || 0), 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocatedKwh || 0), 0);
  const fulfillment = calculateFulfillmentStats(allocations);

  // Jain's index on actual allocated amounts
  const jainsAllocationIndex = calculateJainsIndex(allocations.map((a) => a.allocatedKwh));

  // Jain's index on fulfillment ratios (relative fairness)
  const jainsFulfillmentIndex = calculateJainsIndex(fulfillment.ratios);

  const efficiencyPct = calculateAllocationEfficiency(totalAllocated, availableSupplyKwh);
  const unmetDemandKwh = calculateUnmetDemand(totalRequested, totalAllocated);

  return {
    totalAvailableSupplyKwh: Number(availableSupplyKwh.toFixed(4)),
    totalRequestedKwh: Number(totalRequested.toFixed(4)),
    totalAllocatedKwh: Number(totalAllocated.toFixed(4)),
    unmetDemandKwh,
    allocationEfficiencyPct: efficiencyPct,
    overallFulfillmentRatio: fulfillment.overallFulfillment,
    averageFulfillmentRatio: fulfillment.averageFulfillment,
    minFulfillmentRatio: fulfillment.minFulfillment,
    maxFulfillmentRatio: fulfillment.maxFulfillment,
    jainsAllocationIndex,
    jainsFulfillmentIndex,
    // Jain's Fairness Index for backward-compatibility with database schema
    jainFairnessIndex: jainsFulfillmentIndex,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),
    matchedTransactionsCount: matchesCount || allocations.filter((a) => a.allocatedKwh > 0).length,
    totalTradedEnergyKwh: Number(totalAllocated.toFixed(4)),
    fairnessInterpretation:
      jainsFulfillmentIndex >= 0.95
        ? "Excellent fairness distribution across all consumer demand tiers."
        : jainsFulfillmentIndex >= 0.8
        ? "Good balanced allocation with minor priority-weighted variance."
        : "Moderate allocation variance due to strict priority weighting or extreme demand disparity.",
  };
}

module.exports = {
  calculateJainsIndex,
  calculateFulfillmentStats,
  calculateAllocationEfficiency,
  calculateUnmetDemand,
  computeComprehensiveMetrics,
};
