/**
 * Demand-Aware Weighted Proportional Energy Allocation Algorithm
 * 
 * Allocates available renewable energy supply among multiple competing consumers
 * based on their requested demand and priority weights (e.g. Critical, Commercial, Standard).
 * 
 * Formula:
 * Effective Weight = W_i * D_i
 * Allocation Share = Supply * (Effective Weight_i / Sum of Effective Weights)
 * Capped at requested demand D_i, with iterative redistribution of residual surplus.
 * 
 * Strictly deterministic and rule-based (No ML/DL).
 */

/**
 * @param {Array<{id: string|number, requestedKwh: number, priorityWeight: number}>} requests 
 * @param {number} availableSupplyKwh 
 * @returns {{allocations: Array<{id: string|number, requestedKwh: number, allocatedKwh: number, fulfillmentRate: number}>, totalAllocatedKwh: number, unallocatedSupplyKwh: number}}
 */
function allocateProportionally(requests, availableSupplyKwh) {
  if (!requests || requests.length === 0 || availableSupplyKwh <= 0) {
    return {
      allocations: (requests || []).map(r => ({ id: r.id, requestedKwh: r.requestedKwh, allocatedKwh: 0, fulfillmentRate: 0 })),
      totalAllocatedKwh: 0,
      unallocatedSupplyKwh: Math.max(0, availableSupplyKwh || 0),
    };
  }

  const totalDemand = requests.reduce((sum, r) => sum + Number(r.requestedKwh), 0);

  // If supply meets or exceeds total demand, fulfill 100% of each request
  if (availableSupplyKwh >= totalDemand) {
    const allocations = requests.map(r => ({
      id: r.id,
      requestedKwh: Number(r.requestedKwh),
      allocatedKwh: Number(r.requestedKwh),
      fulfillmentRate: 1.0,
    }));
    return {
      allocations,
      totalAllocatedKwh: totalDemand,
      unallocatedSupplyKwh: Number((availableSupplyKwh - totalDemand).toFixed(4)),
    };
  }

  // Iterative constrained proportional allocation
  let remainingSupply = availableSupplyKwh;
  let activeRequests = requests.map(r => ({
    id: r.id,
    requestedKwh: Number(r.requestedKwh),
    priorityWeight: Math.max(0.1, Number(r.priorityWeight || 1.0)),
    allocatedKwh: 0,
    isSatisfied: false,
  }));

  const MAX_ITERATIONS = 5;
  let iteration = 0;

  while (remainingSupply > 0.001 && iteration < MAX_ITERATIONS) {
    iteration++;
    const unsatisfied = activeRequests.filter(r => !r.isSatisfied && r.allocatedKwh < r.requestedKwh);
    if (unsatisfied.length === 0) break;

    const totalWeightedDemand = unsatisfied.reduce(
      (sum, r) => sum + (r.requestedKwh - r.allocatedKwh) * r.priorityWeight,
      0
    );

    if (totalWeightedDemand <= 0) break;

    let supplyDistributedThisRound = 0;

    for (const req of unsatisfied) {
      const remainingNeed = req.requestedKwh - req.allocatedKwh;
      const effectiveWeight = remainingNeed * req.priorityWeight;
      const share = remainingSupply * (effectiveWeight / totalWeightedDemand);

      const allocationDelta = Math.min(remainingNeed, share);
      req.allocatedKwh += allocationDelta;
      supplyDistributedThisRound += allocationDelta;

      if (req.allocatedKwh >= req.requestedKwh - 0.0001) {
        req.allocatedKwh = req.requestedKwh;
        req.isSatisfied = true;
      }
    }

    remainingSupply = Math.max(0, remainingSupply - supplyDistributedThisRound);
  }

  const finalAllocations = activeRequests.map(r => ({
    id: r.id,
    requestedKwh: Number(r.requestedKwh.toFixed(4)),
    allocatedKwh: Number(r.allocatedKwh.toFixed(4)),
    fulfillmentRate: Number((r.allocatedKwh / r.requestedKwh).toFixed(4)),
  }));

  const totalAllocated = finalAllocations.reduce((sum, r) => sum + r.allocatedKwh, 0);

  return {
    allocations: finalAllocations,
    totalAllocatedKwh: Number(totalAllocated.toFixed(4)),
    unallocatedSupplyKwh: Number(remainingSupply.toFixed(4)),
  };
}

module.exports = {
  allocateProportionally,
};
