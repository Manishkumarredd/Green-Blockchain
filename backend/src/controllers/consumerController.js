const consumerService = require("../services/consumerService");
const { sendSuccess } = require("../utils/responseHandler");

class ConsumerController {
  async createRequest(req, res, next) {
    try {
      const request = await consumerService.createRequest({
        consumerId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, request, "Energy demand request created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyRequests(req, res, next) {
    try {
      const requests = await consumerService.getConsumerRequests(req.user.id);
      return sendSuccess(res, requests, "Consumer requests retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async getMyAllocations(req, res, next) {
    try {
      const allocations = await consumerService.getConsumerAllocations(req.user.id);
      return sendSuccess(res, allocations, "Consumer allocation history retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const stats = await consumerService.getConsumerDashboardStats(req.user.id);
      return sendSuccess(res, stats, "Consumer dashboard metrics retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConsumerController();
