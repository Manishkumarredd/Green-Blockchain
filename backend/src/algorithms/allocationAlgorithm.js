/**
 * GreenLedger Core Research Allocation Algorithms
 * 
 * 1. Proposed: Demand-Aware Weighted Proportional Allocation (DA-WPA)
 * 2. Baseline 1: First-Come, First-Served (FCFS) Allocation
 * 3. Baseline 2: Basic Proportional Allocation (BPA) with Demand Caps
 * 
 * Strictly deterministic, auditable, and rule-based mathematical formulations.
 * Free of machine learning and black-box dependencies.
 */

const { computeComprehensiveMetrics } = require("./fairnessMetrics");

/**
 * 1. Proposed Algorithm: Demand-Aware Weighted Proportional Allocation (DA-WPA)
 * 
 * Allocates available renewable supply S among multiple consumers based on:
 * - Requested demand d_i
 * - Priority weight w_i (e.g., 2.0x for Critical Healthcare, 1.5x Commercial, 1.0x Standard)
 * - Strict demand cap: x_i = min(d_i, S * (w_i * d_i / sum(w_j * d_j)))
 * - Iterative redistribution of residual surplus until available supply is exhausted or all demands are fulfilled.
 * 
 * @param {Array<{id: string|number, consumerId?: string|number, requestedKwh: number, priorityWeight?: number, timestamp?: Date|string}>} requests
 * @param {number} availableSupplyKwh Total renewable supply S
 * @param {object} [options]
 * @returns {object} Allocation results with itemized shares and comprehensive fairness metrics
 */
function allocateDemandAwareWeightedProportional(requests, availableSupplyKwh, options = {}) {
  const startTime = process.hrtime();
  const supply = Math.max(0, Number(availableSupplyKwh || 0));

  if (!requests || requests.length === 0 || supply === 0) {
    const emptyAllocations = (requests || []).map((r) => ({
      id: r.id,
      consumerId: r.consumerId || r.id,
      requestedKwh: Number(r.requestedKwh || 0),
      allocatedKwh: 0,
      unfulfilledKwh: Number(r.requestedKwh || 0),
      fulfillmentRatio: 0.0,
      fulfillmentRate: 0.0,
      priorityWeight: Number(r.priorityWeight || 1.0),
    }));

    const metrics = computeComprehensiveMetrics({
      allocations: emptyAllocations,
      availableSupplyKwh: supply,
      executionTimeMs: 0.05,
    });

    return {
      algorithm: "DEMAND_AWARE_WEIGHTED_PROPORTIONAL",
      allocations: emptyAllocations,
      totalAllocatedKwh: 0,
      unallocatedSupplyKwh: supply,
      metrics,
    };
  }

  const totalDemand = requests.reduce((sum, r) => sum + Math.max(0, Number(r.requestedKwh || 0)), 0);

  // If available supply meets or exceeds total aggregate demand, 100% fulfillment for all
  if (supply >= totalDemand) {
    const fullAllocations = requests.map((r) => {
      const d = Math.max(0, Number(r.requestedKwh || 0));
      return {
        id: r.id,
        consumerId: r.consumerId || r.id,
        requestedKwh: d,
        allocatedKwh: d,
        unfulfilledKwh: 0,
        fulfillmentRatio: 1.0,
        fulfillmentRate: 1.0,
        priorityWeight: Math.max(0.1, Number(r.priorityWeight || 1.0)),
      };
    });

    const elapsed = process.hrtime(startTime);
    const executionTimeMs = elapsed[0] * 1000 + elapsed[1] / 1000000;
    const metrics = computeComprehensiveMetrics({
      allocations: fullAllocations,
      availableSupplyKwh: supply,
      executionTimeMs,
    });

    return {
      algorithm: "DEMAND_AWARE_WEIGHTED_PROPORTIONAL",
      allocations: fullAllocations,
      totalAllocatedKwh: Number(totalDemand.toFixed(4)),
      unallocatedSupplyKwh: Number(Math.max(0, supply - totalDemand).toFixed(4)),
      metrics,
    };
  }

  // Iterative constrained proportional allocation with surplus redistribution
  let remainingSupply = supply;
  const activeQueue = requests.map((r) => ({
    id: r.id,
    consumerId: r.consumerId || r.id,
    requestedKwh: Math.max(0, Number(r.requestedKwh || 0)),
    priorityWeight: Math.max(0.1, Number(r.priorityWeight || 1.0)),
    allocatedKwh: 0,
    isSatisfied: false,
  }));

  const MAX_REDISTRIBUTION_ROUNDS = 10;
  let round = 0;

  while (remainingSupply > 0.0001 && round < MAX_REDISTRIBUTION_ROUNDS) {
    round++;
    const unsatisfied = activeQueue.filter((r) => !r.isSatisfied && r.allocatedKwh < r.requestedKwh);
    if (unsatisfied.length === 0) break;

    // Calculate sum of remaining weighted demand for unsatisfied consumers
    const sumWeightedRemaining = unsatisfied.reduce((sum, r) => {
      const remainingNeed = r.requestedKwh - r.allocatedKwh;
      return sum + remainingNeed * r.priorityWeight;
    }, 0);

    if (sumWeightedRemaining <= 0) break;

    let distributedInRound = 0;

    for (const req of unsatisfied) {
      const remainingNeed = req.requestedKwh - req.allocatedKwh;
      const effectiveWeight = remainingNeed * req.priorityWeight;
      const proportionalShare = remainingSupply * (effectiveWeight / sumWeightedRemaining);

      // Apply strict demand cap: x_i = min(d_i - x_i, proportionalShare)
      const allocatedDelta = Math.min(remainingNeed, proportionalShare);
      req.allocatedKwh += allocatedDelta;
      distributedInRound += allocatedDelta;

      if (req.allocatedKwh >= req.requestedKwh - 0.0001) {
        req.allocatedKwh = req.requestedKwh;
        req.isSatisfied = true;
      }
    }

    remainingSupply = Math.max(0, remainingSupply - distributedInRound);
  }

  const elapsed = process.hrtime(startTime);
  const executionTimeMs = elapsed[0] * 1000 + elapsed[1] / 1000000;

  const finalAllocations = activeQueue.map((r) => {
    const alloc = Number(r.allocatedKwh.toFixed(4));
    const req = Number(r.requestedKwh.toFixed(4));
    return {
      id: r.id,
      consumerId: r.consumerId,
      requestedKwh: req,
      allocatedKwh: alloc,
      unfulfilledKwh: Number(Math.max(0, req - alloc).toFixed(4)),
      fulfillmentRatio: req > 0 ? Number((alloc / req).toFixed(4)) : 1.0,
      fulfillmentRate: req > 0 ? Number((alloc / req).toFixed(4)) : 1.0,
      priorityWeight: r.priorityWeight,
    };
  });

  const metrics = computeComprehensiveMetrics({
    allocations: finalAllocations,
    availableSupplyKwh: supply,
    executionTimeMs,
  });

  return {
    algorithm: "DEMAND_AWARE_WEIGHTED_PROPORTIONAL",
    allocations: finalAllocations,
    totalAllocatedKwh: metrics.totalAllocatedKwh,
    unallocatedSupplyKwh: Number(Math.max(0, supply - metrics.totalAllocatedKwh).toFixed(4)),
    metrics,
  };
}

/**
 * 2. Baseline 1: First-Come, First-Served (FCFS) Allocation
 * 
 * Allocates available energy sequentially strictly in order of request submission timestamps.
 * 
 * @param {Array<{id: string|number, consumerId?: string|number, requestedKwh: number, timestamp?: Date|string}>} requests
 * @param {number} availableSupplyKwh
 */
function allocateFCFS(requests, availableSupplyKwh) {
  const startTime = process.hrtime();
  const supply = Math.max(0, Number(availableSupplyKwh || 0));

  // Sort strictly by submission timestamp or existing order
  const sortedRequests = [...(requests || [])].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  let remainingSupply = supply;
  const allocations = [];

  for (const r of sortedRequests) {
    const req = Math.max(0, Number(r.requestedKwh || 0));
    const alloc = Math.min(req, remainingSupply);
    remainingSupply = Math.max(0, remainingSupply - alloc);

    allocations.push({
      id: r.id,
      consumerId: r.consumerId || r.id,
      requestedKwh: req,
      allocatedKwh: Number(alloc.toFixed(4)),
      unfulfilledKwh: Number(Math.max(0, req - alloc).toFixed(4)),
      fulfillmentRatio: req > 0 ? Number((alloc / req).toFixed(4)) : 1.0,
      fulfillmentRate: req > 0 ? Number((alloc / req).toFixed(4)) : 1.0,
      priorityWeight: Number(r.priorityWeight || 1.0),
    });
  }

  const elapsed = process.hrtime(startTime);
  const executionTimeMs = elapsed[0] * 1000 + elapsed[1] / 1000000;
  const metrics = computeComprehensiveMetrics({
    allocations,
    availableSupplyKwh: supply,
    executionTimeMs,
  });

  return {
    algorithm: "FIRST_COME_FIRST_SERVED",
    allocations,
    totalAllocatedKwh: metrics.totalAllocatedKwh,
    unallocatedSupplyKwh: Number(Math.max(0, supply - metrics.totalAllocatedKwh).toFixed(4)),
    metrics,
  };
}

/**
 * 3. Baseline 2: Basic Proportional Allocation (BPA) with Demand Caps
 * 
 * Allocates proportionally based purely on demand ratio:
 * x_i = S * (d_i / sum(d_j))
 * with uniform weights (w_i = 1.0 for all consumers) and surplus redistribution.
 * 
 * @param {Array<{id: string|number, consumerId?: string|number, requestedKwh: number}>} requests
 * @param {number} availableSupplyKwh
 */
function allocateBasicProportional(requests, availableSupplyKwh) {
  const uniformRequests = (requests || []).map((r) => ({
    ...r,
    priorityWeight: 1.0,
  }));

  const res = allocateDemandAwareWeightedProportional(uniformRequests, availableSupplyKwh);
  return {
    ...res,
    algorithm: "BASIC_PROPORTIONAL",
  };
}

module.exports = {
  allocateDemandAwareWeightedProportional,
  allocateFCFS,
  allocateBasicProportional,
  // Backward compatibility alias
  allocateProportionally: allocateDemandAwareWeightedProportional,
};
