const db = require("../config/db");
const { allocateProportionally } = require("../algorithms/allocation");
const { AppError } = require("../utils/errorHandler");

/**
 * Calculates Jain's Fairness Index for an array of fulfillment ratios
 * J(x) = (sum(x_i))^2 / (n * sum(x_i^2))
 */
function calculateJainsIndex(ratios) {
  if (!ratios || ratios.length === 0) return 1.0;
  const n = ratios.length;
  const sum = ratios.reduce((acc, val) => acc + val, 0);
  const sumSq = ratios.reduce((acc, val) => acc + val * val, 0);
  if (sumSq === 0) return 0;
  return Number(((sum * sum) / (n * sumSq)).toFixed(4));
}

/**
 * First-Come First-Served (FCFS) Allocation Baseline
 */
function allocateFCFS(requests, availableSupplyKwh) {
  let remaining = availableSupplyKwh;
  const allocations = [];

  for (const r of requests) {
    const allocated = Math.min(r.requestedKwh, remaining);
    remaining = Math.max(0, remaining - allocated);
    allocations.push({
      id: r.id,
      consumerId: r.consumerId || r.id,
      requestedKwh: r.requestedKwh,
      allocatedKwh: Number(allocated.toFixed(4)),
      fulfillmentRate: Number((allocated / r.requestedKwh).toFixed(4)),
    });
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedKwh, 0);
  return {
    allocations,
    totalAllocatedKwh: Number(totalAllocated.toFixed(4)),
    unallocatedSupplyKwh: Number(remaining.toFixed(4)),
  };
}

/**
 * Basic Proportional Allocation Baseline (Uniform Weights = 1.0)
 */
function allocateBasicProportional(requests, availableSupplyKwh) {
  const uniformRequests = requests.map((r) => ({ ...r, priorityWeight: 1.0 }));
  return allocateProportionally(uniformRequests, availableSupplyKwh);
}

class AllocationService {
  async executeAllocation({ algorithm = "WEIGHTED_PROPORTIONAL", requestIds, listingIds } = {}) {
    const startTime = process.hrtime();

    // 1. Fetch active requests
    let requests = [];
    if (db.isConnected) {
      let sql = "SELECT * FROM energy_requests WHERE request_status = 'PENDING'";
      const params = [];
      if (requestIds && requestIds.length > 0) {
        sql += " AND id = ANY($1)";
        params.push(requestIds);
      }
      sql += " ORDER BY priority_weight DESC, created_at ASC";
      const res = await db.query(sql, params);
      requests = res.rows;
    } else {
      requests = db.inMemoryStore.energy_requests.filter(
        (r) => (r.request_status || r.status) === "PENDING" && (!requestIds || requestIds.includes(r.id))
      );
    }

    // 2. Fetch available supply
    let totalAvailableSupply = 0;
    if (db.isConnected) {
      let sql = "SELECT SUM(available_energy_kwh) as total FROM energy_listings WHERE listing_status = 'ACTIVE'";
      const params = [];
      if (listingIds && listingIds.length > 0) {
        sql += " AND id = ANY($1)";
        params.push(listingIds);
      }
      const res = await db.query(sql, params);
      totalAvailableSupply = Number(res.rows[0].total || 0);
    } else {
      const activeListings = db.inMemoryStore.energy_listings.filter(
        (l) => (l.listing_status || l.status) === "ACTIVE" && (!listingIds || listingIds.includes(l.id))
      );
      totalAvailableSupply = activeListings.reduce((sum, l) => sum + Number(l.available_energy_kwh || 0), 0);
    }

    if (requests.length === 0) {
      throw new AppError("No pending energy requests available to allocate.", 400);
    }

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      consumerId: r.consumer_id,
      requestedKwh: Number(r.requested_energy_kwh || r.requested_kwh),
      priorityWeight: Number(r.priority_weight || 1.0),
    }));

    // 3. Execute chosen algorithm
    let result = null;
    let algorithmName = "";

    if (algorithm === "FCFS") {
      result = allocateFCFS(formattedRequests, totalAvailableSupply);
      algorithmName = "FIRST_COME_FIRST_SERVED";
    } else if (algorithm === "PROPORTIONAL") {
      result = allocateBasicProportional(formattedRequests, totalAvailableSupply);
      algorithmName = "BASIC_PROPORTIONAL";
    } else {
      result = allocateProportionally(formattedRequests, totalAvailableSupply);
      algorithmName = "DEMAND_AWARE_WEIGHTED_PROPORTIONAL";
    }

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const executionTimeMs = Number((seconds * 1000 + nanoseconds / 1000000).toFixed(2));

    const totalRequested = formattedRequests.reduce((sum, r) => sum + r.requestedKwh, 0);
    const jainIndex = calculateJainsIndex(result.allocations.map((a) => a.fulfillmentRate));

    // 4. Persist in database
    let allocationRecord = null;
    if (db.isConnected) {
      const insertResult = await db.query(
        `INSERT INTO allocation_results (total_available_energy, total_requested_energy, total_allocated_energy, algorithm_name, jain_fairness_index, execution_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [totalAvailableSupply, totalRequested, result.totalAllocatedKwh, algorithmName, jainIndex, executionTimeMs]
      );
      allocationRecord = insertResult.rows[0];

      for (const item of result.allocations) {
        const reqObj = formattedRequests.find((r) => r.id === item.id) || {};
        const unfulfilled = Math.max(0, item.requestedKwh - item.allocatedKwh);
        await db.query(
          `INSERT INTO allocation_details (allocation_result_id, consumer_id, requested_energy_kwh, allocated_energy_kwh, unfulfilled_energy_kwh, fulfillment_ratio)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [allocationRecord.id, reqObj.consumerId || 1, item.requestedKwh, item.allocatedKwh, unfulfilled, item.fulfillmentRate]
        );
      }
    } else {
      allocationRecord = {
        id: db.inMemoryStore.allocation_results.length + 1,
        total_available_energy: totalAvailableSupply,
        total_requested_energy: totalRequested,
        total_allocated_energy: result.totalAllocatedKwh,
        algorithm_name: algorithmName,
        jain_fairness_index: jainIndex,
        execution_time_ms: executionTimeMs,
        created_at: new Date(),
      };
      db.inMemoryStore.allocation_results.push(allocationRecord);

      for (const item of result.allocations) {
        const reqObj = formattedRequests.find((r) => r.id === item.id) || {};
        const detail = {
          id: db.inMemoryStore.allocation_details.length + 1,
          allocation_result_id: allocationRecord.id,
          consumer_id: reqObj.consumerId || 1,
          requested_energy_kwh: item.requestedKwh,
          allocated_energy_kwh: item.allocatedKwh,
          unfulfilled_energy_kwh: Math.max(0, item.requestedKwh - item.allocatedKwh),
          fulfillment_ratio: item.fulfillmentRate,
        };
        db.inMemoryStore.allocation_details.push(detail);
      }
    }

    return {
      allocationResult: allocationRecord,
      allocations: result.allocations,
      jainFairnessIndex: jainIndex,
      executionTimeMs,
    };
  }

  async getAllocationResults() {
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM allocation_results ORDER BY created_at DESC LIMIT 50");
      return res.rows;
    } else {
      return db.inMemoryStore.allocation_results;
    }
  }

  async getAllocationResultById(id) {
    let result = null;
    let details = [];

    if (db.isConnected) {
      const res = await db.query("SELECT * FROM allocation_results WHERE id = $1", [id]);
      result = res.rows[0];

      if (result) {
        const detRes = await db.query(
          `SELECT ad.*, u.full_name as consumer_name, u.meter_id
           FROM allocation_details ad
           JOIN users u ON ad.consumer_id = u.id
           WHERE ad.allocation_result_id = $1`,
          [id]
        );
        details = detRes.rows;
      }
    } else {
      result = db.inMemoryStore.allocation_results.find((r) => r.id === Number(id));
      if (result) {
        details = db.inMemoryStore.allocation_details
          .filter((d) => d.allocation_result_id === Number(id))
          .map((d) => {
            const u = db.inMemoryStore.users.find((user) => user.id === d.consumer_id) || {};
            return {
              ...d,
              consumer_name: u.full_name || u.name,
              meter_id: u.meter_id,
            };
          });
      }
    }

    if (!result) {
      throw new AppError("Allocation result not found.", 404);
    }

    return { ...result, details };
  }

  async compareAllocationAlgorithms() {
    let requests = [];
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM energy_requests WHERE request_status = 'PENDING' ORDER BY id ASC");
      requests = res.rows;
    } else {
      requests = db.inMemoryStore.energy_requests.filter((r) => (r.request_status || r.status) === "PENDING");
    }

    let totalAvailableSupply = 0;
    if (db.isConnected) {
      const res = await db.query("SELECT SUM(available_energy_kwh) as total FROM energy_listings WHERE listing_status = 'ACTIVE'");
      totalAvailableSupply = Number(res.rows[0].total || 550);
    } else {
      totalAvailableSupply = db.inMemoryStore.energy_listings.reduce(
        (sum, l) => sum + Number(l.available_energy_kwh || 0),
        0
      );
    }

    const testRequests =
      requests.length > 0
        ? requests.map((r) => ({
            id: r.id,
            consumerId: r.consumer_id,
            requestedKwh: Number(r.requested_energy_kwh || r.requested_kwh),
            priorityWeight: Number(r.priority_weight || 1.0),
          }))
        : [
            { id: 1, consumerId: 6, requestedKwh: 80, priorityWeight: 2.0 },
            { id: 2, consumerId: 5, requestedKwh: 200, priorityWeight: 1.5 },
            { id: 3, consumerId: 7, requestedKwh: 50, priorityWeight: 1.0 },
          ];

    // Constrain supply to simulate scarcity benchmark (e.g. 70% of total demand)
    const totalDemand = testRequests.reduce((sum, r) => sum + r.requestedKwh, 0);
    const benchmarkSupply = Math.min(totalAvailableSupply, totalDemand * 0.7);

    // 1. FCFS
    const fcfsRes = allocateFCFS(testRequests, benchmarkSupply);
    const fcfsJain = calculateJainsIndex(fcfsRes.allocations.map((a) => a.fulfillmentRate));

    // 2. Basic Proportional
    const propRes = allocateBasicProportional(testRequests, benchmarkSupply);
    const propJain = calculateJainsIndex(propRes.allocations.map((a) => a.fulfillmentRate));

    // 3. Proposed Demand-Aware Weighted Proportional
    const weightedRes = allocateProportionally(testRequests, benchmarkSupply);
    const weightedJain = calculateJainsIndex(weightedRes.allocations.map((a) => a.fulfillmentRate));

    return {
      benchmarkSupplyKwh: Number(benchmarkSupply.toFixed(2)),
      totalDemandKwh: Number(totalDemand.toFixed(2)),
      algorithms: {
        fcfs: {
          name: "First-Come First-Served (FCFS)",
          totalAllocatedKwh: fcfsRes.totalAllocatedKwh,
          jainFairnessIndex: fcfsJain,
          allocations: fcfsRes.allocations,
        },
        basicProportional: {
          name: "Basic Proportional Allocation",
          totalAllocatedKwh: propRes.totalAllocatedKwh,
          jainFairnessIndex: propJain,
          allocations: propRes.allocations,
        },
        proposedWeighted: {
          name: "Proposed Demand-Aware Weighted Proportional",
          totalAllocatedKwh: weightedRes.totalAllocatedKwh,
          jainFairnessIndex: weightedJain,
          allocations: weightedRes.allocations,
        },
      },
      analysis: {
        recommendedAlgorithm: "Proposed Demand-Aware Weighted Proportional",
        fairnessAdvantagePercent: Number((((weightedJain - fcfsJain) / fcfsJain) * 100).toFixed(2)),
      },
    };
  }
}

module.exports = new AllocationService();
