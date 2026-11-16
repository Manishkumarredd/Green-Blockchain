const allocationService = require("../services/allocationService");
const { sendSuccess } = require("../utils/responseHandler");

class AlgorithmController {
  /**
   * Run Price-Aware Greedy Matching
   * POST /api/v1/algorithms/match
   */
  async match(req, res, next) {
    try {
      const result = await allocationService.executeGreedyMatching(req.body);
      return sendSuccess(res, result, "Price-aware greedy matching executed successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Run Energy Allocation
   * POST /api/v1/algorithms/allocate
   */
  async allocate(req, res, next) {
    try {
      const result = await allocationService.executeAllocation(req.body);
      return sendSuccess(res, result, "Energy allocation cycle executed successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Allocation Execution Details by ID
   * GET /api/v1/algorithms/results/:id
   */
  async getResultById(req, res, next) {
    try {
      const result = await allocationService.getAllocationResultById(req.params.id);
      return sendSuccess(res, result, "Allocation execution details retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Detailed Fairness and Performance Metrics for an Execution
   * GET /api/v1/algorithms/metrics/:id
   */
  async getMetricsById(req, res, next) {
    try {
      const result = await allocationService.getAllocationResultById(req.params.id);
      const metrics = {
        executionId: result.id,
        algorithmName: result.algorithm_name,
        jainFairnessIndex: result.jain_fairness_index,
        executionTimeMs: result.execution_time_ms,
        totalAvailableEnergy: result.total_available_energy,
        totalRequestedEnergy: result.total_requested_energy,
        totalAllocatedEnergy: result.total_allocated_energy,
        unmetEnergyDemand: Math.max(0, Number(result.total_requested_energy) - Number(result.total_allocated_energy)),
        allocationEfficiencyPct: Number(result.total_available_energy) > 0
          ? Number(((Number(result.total_allocated_energy) / Number(result.total_available_energy)) * 100).toFixed(2))
          : 100,
        overallFulfillmentRatio: Number(result.total_requested_energy) > 0
          ? Number((Number(result.total_allocated_energy) / Number(result.total_requested_energy)).toFixed(4))
          : 1.0,
        participantsCount: (result.details || []).length,
        allocations: result.details || [],
      };
      return sendSuccess(res, metrics, "Allocation fairness and performance metrics retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Current Rule-Based Dynamic Price
   * GET /api/v1/algorithms/pricing
   */
  async getPricing(req, res, next) {
    try {
      const { hourOfDay, energySource, persist } = req.query;
      const pricing = await allocationService.getDynamicPricingRecommendation({
        hourOfDay: hourOfDay ? Number(hourOfDay) : undefined,
        energySource,
        persist: persist === "true",
      });
      return sendSuccess(res, pricing, "Current dynamic pricing recommendation calculated");
    } catch (err) {
      next(err);
    }
  }

  /**
   * List Available Research Experiment Scenarios
   * GET /api/v1/algorithms/experiments
   */
  async getExperiments(req, res, next) {
    try {
      const scenarios = allocationService.getExperimentScenarios();
      return sendSuccess(res, scenarios, "Predefined research experiment scenarios retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Execute Reproducible Experiment Scenario
   * POST /api/v1/algorithms/experiments/run
   */
  async runExperiment(req, res, next) {
    try {
      const { scenarioId = "LOW_SUPPLY_HIGH_DEMAND", ...overrides } = req.body;
      const result = allocationService.runExperiment(scenarioId, overrides);
      return sendSuccess(res, result, "Reproducible research experiment scenario completed");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Live Benchmark Comparison
   * GET /api/v1/algorithms/compare
   */
  async compare(req, res, next) {
    try {
      const result = await allocationService.compareAllocationAlgorithms();
      return sendSuccess(res, result, "Live algorithm benchmark comparison generated");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AlgorithmController();
