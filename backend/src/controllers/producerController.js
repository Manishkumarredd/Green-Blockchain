const producerService = require("../services/producerService");
const { sendSuccess } = require("../utils/responseHandler");

class ProducerController {
  async createListing(req, res, next) {
    try {
      const listing = await producerService.createListing({
        producerId: req.user.id,
        ...req.body,
      });
      return sendSuccess(res, listing, "Energy listing created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyListings(req, res, next) {
    try {
      const listings = await producerService.getProducerListings(req.user.id);
      return sendSuccess(res, listings, "Producer listings retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async getListingById(req, res, next) {
    try {
      const listing = await producerService.getListingById(req.params.id);
      return sendSuccess(res, listing, "Listing retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  async updateListing(req, res, next) {
    try {
      const updated = await producerService.updateListing(req.params.id, req.user.id, req.body);
      return sendSuccess(res, updated, "Listing updated successfully");
    } catch (err) {
      next(err);
    }
  }

  async deleteListing(req, res, next) {
    try {
      const result = await producerService.deleteListing(req.params.id, req.user.id);
      return sendSuccess(res, result, "Listing removed or cancelled successfully");
    } catch (err) {
      next(err);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const stats = await producerService.getProducerDashboardStats(req.user.id);
      return sendSuccess(res, stats, "Producer dashboard metrics retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProducerController();
