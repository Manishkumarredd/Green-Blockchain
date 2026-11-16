const db = require("../config/db");
const {
  allocateDemandAwareWeightedProportional,
  allocateFCFS,
  allocateBasicProportional,
} = require("../algorithms/allocationAlgorithm");
const { matchOrdersGreedy } = require("../algorithms/greedyMatching");
const { calculateRuleBasedDynamicPrice } = require("../algorithms/dynamicPricing");
const { computeComprehensiveMetrics, calculateJainsIndex } = require("../algorithms/fairnessMetrics");
const {
  RESEARCH_SCENARIOS,
  runExperimentScenario,
} = require("../algorithms/algorithmUtils");
const { AppError } = require("../utils/errorHandler");

class AllocationService {
  /**
   * Execute an energy allocation cycle using specified algorithm
   */
  async executeAllocation({
    algorithm = "WEIGHTED_PROPORTIONAL",
    requestIds,
    listingIds,
    isSimulation = false,
  } = {}) {
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
      timestamp: r.created_at,
    }));

    // 3. Execute chosen algorithm
    let execution = null;
    let algorithmName = "";

    if (algorithm === "FCFS") {
      execution = allocateFCFS(formattedRequests, totalAvailableSupply);
      algorithmName = "FIRST_COME_FIRST_SERVED";
    } else if (algorithm === "PROPORTIONAL" || algorithm === "BASIC_PROPORTIONAL") {
      execution = allocateBasicProportional(formattedRequests, totalAvailableSupply);
      algorithmName = "BASIC_PROPORTIONAL";
    } else {
      execution = allocateDemandAwareWeightedProportional(formattedRequests, totalAvailableSupply);
      algorithmName = "DEMAND_AWARE_WEIGHTED_PROPORTIONAL";
    }

    const { allocations, metrics } = execution;

    // 4. If not a simulation, persist results in database
    let allocationRecord = null;
    if (!isSimulation) {
      if (db.isConnected) {
        const insertResult = await db.query(
          `INSERT INTO allocation_results (
            total_available_energy, total_requested_energy, total_allocated_energy,
            algorithm_name, jain_fairness_index, execution_time_ms, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            metrics.totalAvailableSupplyKwh,
            metrics.totalRequestedKwh,
            metrics.totalAllocatedKwh,
            algorithmName,
            metrics.jainsFulfillmentIndex,
            metrics.executionTimeMs,
          ]
        );
        allocationRecord = insertResult.rows[0];

        for (const item of allocations) {
          const reqObj = formattedRequests.find((r) => r.id === item.id) || {};
          await db.query(
            `INSERT INTO allocation_details (
              allocation_result_id, consumer_id, requested_energy_kwh,
              allocated_energy_kwh, unfulfilled_energy_kwh, fulfillment_ratio
            )
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              allocationRecord.id,
              reqObj.consumerId || 1,
              item.requestedKwh,
              item.allocatedKwh,
              item.unfulfilledKwh,
              item.fulfillmentRatio,
            ]
          );

          // Update request status
          const newStatus = item.fulfillmentRatio >= 0.999 ? "FULFILLED" : item.allocatedKwh > 0 ? "PARTIALLY_MATCHED" : "PENDING";
          await db.query("UPDATE energy_requests SET request_status = $1 WHERE id = $2", [newStatus, item.id]);
        }
      } else {
        allocationRecord = {
          id: db.inMemoryStore.allocation_results.length + 1,
          total_available_energy: metrics.totalAvailableSupplyKwh,
          total_requested_energy: metrics.totalRequestedKwh,
          total_allocated_energy: metrics.totalAllocatedKwh,
          algorithm_name: algorithmName,
          jain_fairness_index: metrics.jainsFulfillmentIndex,
          execution_time_ms: metrics.executionTimeMs,
          created_at: new Date(),
        };
        db.inMemoryStore.allocation_results.unshift(allocationRecord);

        for (const item of allocations) {
          const reqObj = formattedRequests.find((r) => r.id === item.id) || {};
          const detail = {
            id: db.inMemoryStore.allocation_details.length + 1,
            allocation_result_id: allocationRecord.id,
            consumer_id: reqObj.consumerId || 1,
            requested_energy_kwh: item.requestedKwh,
            allocated_energy_kwh: item.allocatedKwh,
            unfulfilled_energy_kwh: item.unfulfilledKwh,
            fulfillment_ratio: item.fulfillmentRatio,
          };
          db.inMemoryStore.allocation_details.unshift(detail);

          // Update request in memory
          const inMemReq = db.inMemoryStore.energy_requests.find((r) => r.id === item.id);
          if (inMemReq) {
            inMemReq.request_status = item.fulfillmentRatio >= 0.999 ? "FULFILLED" : item.allocatedKwh > 0 ? "PARTIALLY_MATCHED" : "PENDING";
            inMemReq.status = inMemReq.request_status;
          }
        }
      }
    }

    return {
      isSimulation,
      algorithmName,
      allocationRecord: allocationRecord || {
        total_available_energy: metrics.totalAvailableSupplyKwh,
        total_requested_energy: metrics.totalRequestedKwh,
        total_allocated_energy: metrics.totalAllocatedKwh,
        algorithm_name: algorithmName,
        jain_fairness_index: metrics.jainsFulfillmentIndex,
        execution_time_ms: metrics.executionTimeMs,
        created_at: new Date(),
      },
      allocations,
      metrics,
    };
  }

  /**
   * Execute Greedy Double-Auction Matching
   */
  async executeGreedyMatching({ pricingRule = "MIDPOINT", listingIds, requestIds } = {}) {
    let listings = [];
    let requests = [];

    if (db.isConnected) {
      let lSql = "SELECT * FROM energy_listings WHERE listing_status = 'ACTIVE'";
      const lParams = [];
      if (listingIds && listingIds.length > 0) {
        lSql += " AND id = ANY($1)";
        lParams.push(listingIds);
      }
      const lRes = await db.query(lSql, lParams);
      listings = lRes.rows;

      let rSql = "SELECT * FROM energy_requests WHERE request_status = 'PENDING'";
      const rParams = [];
      if (requestIds && requestIds.length > 0) {
        rSql += " AND id = ANY($1)";
        rParams.push(requestIds);
      }
      const rRes = await db.query(rSql, rParams);
      requests = rRes.rows;
    } else {
      listings = db.inMemoryStore.energy_listings.filter(
        (l) => (l.listing_status || l.status) === "ACTIVE" && (!listingIds || listingIds.includes(l.id))
      );
      requests = db.inMemoryStore.energy_requests.filter(
        (r) => (r.request_status || r.status) === "PENDING" && (!requestIds || requestIds.includes(r.id))
      );
    }

    const result = matchOrdersGreedy(listings, requests, { pricingRule });
    return result;
  }

  /**
   * Get dynamic pricing recommendations based on current supply and demand
   */
  async getDynamicPricingRecommendation({ hourOfDay, energySource = "SOLAR", persist = false, customConfig } = {}) {
    let totalSupply = 0;
    let totalDemand = 0;

    if (db.isConnected) {
      const sRes = await db.query("SELECT COALESCE(SUM(available_energy_kwh), 0) as total FROM energy_listings WHERE listing_status = 'ACTIVE'");
      totalSupply = Number(sRes.rows[0].total || 0);

      const dRes = await db.query("SELECT COALESCE(SUM(requested_energy_kwh), 0) as total FROM energy_requests WHERE request_status = 'PENDING'");
      totalDemand = Number(dRes.rows[0].total || 0);
    } else {
      const activeListings = db.inMemoryStore.energy_listings.filter((l) => (l.listing_status || l.status) === "ACTIVE");
      totalSupply = activeListings.reduce((sum, l) => sum + Number(l.available_energy_kwh || 0), 0);

      const activeRequests = db.inMemoryStore.energy_requests.filter((r) => (r.request_status || r.status) === "PENDING");
      totalDemand = activeRequests.reduce((sum, r) => sum + Number(r.requested_energy_kwh || r.requested_kwh || 0), 0);
    }

    const pricing = calculateRuleBasedDynamicPrice({
      totalAvailableSupplyKwh: totalSupply,
      totalDemandKwh: totalDemand,
      hourOfDay,
      energySource,
      customConfig,
    });

    if (persist) {
      if (db.isConnected) {
        await db.query(
          `INSERT INTO pricing_history (
            base_price, supply_quantity, demand_quantity, supply_demand_ratio,
            calculated_price, minimum_price, maximum_price
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            pricing.referencePriceEth,
            pricing.totalAvailableSupplyKwh,
            pricing.totalDemandKwh,
            pricing.supplyDemandRatio,
            pricing.calculatedPriceEth,
            pricing.minPriceFloorEth,
            pricing.maxPriceCeilingEth,
          ]
        );
      } else {
        db.inMemoryStore.pricing_history.unshift({
          id: db.inMemoryStore.pricing_history.length + 1,
          base_price: pricing.referencePriceEth.toFixed(8),
          supply_quantity: pricing.totalAvailableSupplyKwh,
          demand_quantity: pricing.totalDemandKwh,
          supply_demand_ratio: pricing.supplyDemandRatio,
          calculated_price: pricing.calculatedPriceEth.toFixed(8),
          minimum_price: pricing.minPriceFloorEth.toFixed(8),
          maximum_price: pricing.maxPriceCeilingEth.toFixed(8),
          created_at: new Date(),
        });
      }
    }

    return pricing;
  }

  /**
   * Run benchmark comparison across FCFS, Basic Proportional, and Proposed DA-WPA
   */
  async compareAllocationAlgorithms(options = {}) {
    let requests = options.requests || [];
    let totalSupply = options.availableSupplyKwh ?? options.totalSupplyKwh ?? 0;

    if (requests.length === 0 || totalSupply <= 0) {
      if (db.isConnected) {
        const rRes = await db.query("SELECT * FROM energy_requests WHERE request_status = 'PENDING' ORDER BY priority_weight DESC, created_at ASC");
        requests = rRes.rows;

        const sRes = await db.query("SELECT COALESCE(SUM(available_energy_kwh), 0) as total FROM energy_listings WHERE listing_status = 'ACTIVE'");
        totalSupply = Number(sRes.rows[0].total || 0);
      } else {
        requests = db.inMemoryStore.energy_requests.filter((r) => (r.request_status || r.status) === "PENDING");
        const activeListings = db.inMemoryStore.energy_listings.filter((l) => (l.listing_status || l.status) === "ACTIVE");
        totalSupply = activeListings.reduce((sum, l) => sum + Number(l.available_energy_kwh || 0), 0);
      }
    }

    // If no active requests or supply in live tables, fall back to standardized research scenario
    if (requests.length === 0 || totalSupply <= 0) {
      return runExperimentScenario("LOW_SUPPLY_HIGH_DEMAND");
    }

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      consumerId: r.consumer_id ?? r.consumerId,
      requestedKwh: Number(r.requested_energy_kwh ?? r.requested_kwh ?? r.requestedKwh ?? 0),
      priorityWeight: Number(r.priority_weight ?? r.priorityWeight ?? 1.0),
      timestamp: r.created_at ?? r.timestamp ?? new Date(),
    }));

    const fcfs = allocateFCFS(formattedRequests, totalSupply);
    const bpa = allocateBasicProportional(formattedRequests, totalSupply);
    const proposed = allocateDemandAwareWeightedProportional(formattedRequests, totalSupply);

    const comparisonTable = [
      {
        metric: "Jain's Fairness Index",
        fcfs: fcfs.metrics.jainsFulfillmentIndex,
        basicProportional: bpa.metrics.jainsFulfillmentIndex,
        proposedAlgorithm: proposed.metrics.jainsFulfillmentIndex,
        unit: "Index (0-1)",
      },
      {
        metric: "Overall Fulfillment Ratio",
        fcfs: fcfs.metrics.overallFulfillmentRatio,
        basicProportional: bpa.metrics.overallFulfillmentRatio,
        proposedAlgorithm: proposed.metrics.overallFulfillmentRatio,
        unit: "Ratio (0-1)",
      },
      {
        metric: "Minimum Fulfillment Ratio",
        fcfs: fcfs.metrics.minFulfillmentRatio,
        basicProportional: bpa.metrics.minFulfillmentRatio,
        proposedAlgorithm: proposed.metrics.minFulfillmentRatio,
        unit: "Ratio (0-1)",
      },
      {
        metric: "Allocation Efficiency",
        fcfs: fcfs.metrics.allocationEfficiencyPct,
        basicProportional: bpa.metrics.allocationEfficiencyPct,
        proposedAlgorithm: proposed.metrics.allocationEfficiencyPct,
        unit: "%",
      },
      {
        metric: "Unmet Demand",
        fcfs: fcfs.metrics.unmetDemandKwh,
        basicProportional: bpa.metrics.unmetDemandKwh,
        proposedAlgorithm: proposed.metrics.unmetDemandKwh,
        unit: "kWh",
      },
      {
        metric: "Computational Runtime",
        fcfs: fcfs.metrics.executionTimeMs,
        basicProportional: bpa.metrics.executionTimeMs,
        proposedAlgorithm: proposed.metrics.executionTimeMs,
        unit: "ms",
      },
    ];

    return {
      comparisonTable,
      algorithms: {
        fcfs: { name: "First-Come, First-Served", metrics: fcfs.metrics, allocations: fcfs.allocations, totalAllocatedKwh: fcfs.metrics.totalAllocatedKwh },
        FCFS: { name: "First-Come, First-Served", metrics: fcfs.metrics, allocations: fcfs.allocations, totalAllocatedKwh: fcfs.metrics.totalAllocatedKwh },
        basicProportional: { name: "Basic Proportional Allocation", metrics: bpa.metrics, allocations: bpa.allocations, totalAllocatedKwh: bpa.metrics.totalAllocatedKwh },
        BPA: { name: "Basic Proportional Allocation", metrics: bpa.metrics, allocations: bpa.allocations, totalAllocatedKwh: bpa.metrics.totalAllocatedKwh },
        proposedAlgorithm: { name: "Demand-Aware Weighted Proportional (DA-WPA)", metrics: proposed.metrics, allocations: proposed.allocations, totalAllocatedKwh: proposed.metrics.totalAllocatedKwh },
        DA_WPA: { name: "Demand-Aware Weighted Proportional (DA-WPA)", metrics: proposed.metrics, allocations: proposed.allocations, totalAllocatedKwh: proposed.metrics.totalAllocatedKwh },
      },
      totalSupplyKwh: totalSupply,
      totalRequestedKwh: formattedRequests.reduce((sum, r) => sum + r.requestedKwh, 0),
    };
  }

  /**
   * List available research experiment scenarios
   */
  getExperimentScenarios() {
    return Object.values(RESEARCH_SCENARIOS);
  }

  /**
   * Run a reproducible synthetic research scenario
   */
  runExperiment(scenarioKey, customOverrides) {
    return runExperimentScenario(scenarioKey, customOverrides);
  }

  /**
   * Get historical allocation results list
   */
  async getAllocationResults() {
    if (db.isConnected) {
      const res = await db.query("SELECT * FROM allocation_results ORDER BY created_at DESC LIMIT 50");
      return res.rows;
    } else {
      return db.inMemoryStore.allocation_results;
    }
  }

  /**
   * Get specific allocation result details with consumer info
   */
  async getAllocationResultById(id) {
    let result = null;
    let details = [];

    if (db.isConnected) {
      const res = await db.query("SELECT * FROM allocation_results WHERE id = $1", [id]);
      result = res.rows[0];

      if (result) {
        const detRes = await db.query(
          `SELECT ad.*, u.full_name as consumer_name, u.meter_id as consumer_meter_id, cp.priority_tier
           FROM allocation_details ad
           JOIN users u ON ad.consumer_id = u.id
           LEFT JOIN consumer_profiles cp ON u.id = cp.user_id
           WHERE ad.allocation_result_id = $1
           ORDER BY ad.allocated_energy_kwh DESC`,
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
            const user = db.inMemoryStore.users.find((u) => u.id === d.consumer_id) || {};
            return {
              ...d,
              consumer_name: user.full_name || "Consumer",
              consumer_meter_id: user.meter_id || "METER-000",
              priority_tier: "STANDARD",
            };
          });
      }
    }

    if (!result) {
      throw new AppError("Allocation result not found", 404);
    }

    return {
      ...result,
      details,
    };
  }
}

module.exports = new AllocationService();
