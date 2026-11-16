const consumerService = require("../services/consumerService");
const { sendSuccess } = require("../utils/responseHandler");

class ConsumerController {
  async createRequest(req, res, next) {
    try {
      const request = await consumerService.createRequest({
        consumerId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, request, "Energy purchase request submitted successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyRequests(req, res, next) {
    try {
      const result = await consumerService.getConsumerRequests(req.user.id, req.query);
      return sendSuccess(res, result.requests, "Consumer requests retrieved successfully", 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getRequestById(req, res, next) {
    try {
      const request = await consumerService.getRequestById(req.params.id, req.user.id);
      return sendSuccess(res, request, "Energy request details retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async cancelRequest(req, res, next) {
    try {
      const updated = await consumerService.cancelRequest(req.params.id, req.user.id);
      return sendSuccess(res, updated, "Energy request cancelled successfully");
    } catch (err) {
      next(err);
    }
  }

  async getMyPurchases(req, res, next) {
    try {
      const result = await consumerService.getConsumerPurchases(req.user.id, req.query);
      return sendSuccess(res, result.purchases, "Consumer purchases retrieved successfully", 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getCarbonSavings(req, res, next) {
    try {
      const savings = await consumerService.getConsumerCarbonSavings(req.user.id);
      return sendSuccess(res, savings, "Consumer carbon savings summary retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async getMyAllocations(req, res, next) {
    try {
      const allocations = await consumerService.getConsumerAllocations(req.user.id);
      return sendSuccess(res, allocations, "Consumer allocation history retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const stats = await consumerService.getConsumerDashboardStats(req.user.id);
      return sendSuccess(res, stats, "Consumer dashboard metrics retrieved successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConsumerController();
