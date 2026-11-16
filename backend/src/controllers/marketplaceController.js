const marketplaceService = require("../services/marketplaceService");
const { sendSuccess } = require("../utils/responseHandler");

class MarketplaceController {
  async getSummary(req, res, next) {
    try {
      const summary = await marketplaceService.getMarketplaceSummary();
      return sendSuccess(res, summary, "Marketplace summary metrics retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getListings(req, res, next) {
    try {
      const { listings, meta } = await marketplaceService.getMarketplaceListings(req.query);
      return sendSuccess(res, listings, "Marketplace listings retrieved", 200, meta);
    } catch (err) {
      next(err);
    }
  }

  async getListingById(req, res, next) {
    try {
      const listing = await marketplaceService.getListingDetails(req.params.id);
      return sendSuccess(res, listing, "Marketplace listing details retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MarketplaceController();
