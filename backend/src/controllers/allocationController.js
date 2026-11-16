const allocationService = require("../services/allocationService");
const { sendSuccess } = require("../utils/responseHandler");

class AllocationController {
  async execute(req, res, next) {
    try {
      const result = await allocationService.executeAllocation(req.body);
      return sendSuccess(res, result, "Allocation executed successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getResults(req, res, next) {
    try {
      const results = await allocationService.getAllocationResults();
      return sendSuccess(res, results, "Allocation results retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getResultById(req, res, next) {
    try {
      const result = await allocationService.getAllocationResultById(req.params.id);
      return sendSuccess(res, result, "Allocation result details retrieved");
    } catch (err) {
      next(err);
    }
  }

  async compare(req, res, next) {
    try {
      const comparison = await allocationService.compareAllocationAlgorithms();
      return sendSuccess(res, comparison, "Algorithm benchmark comparison computed");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AllocationController();
