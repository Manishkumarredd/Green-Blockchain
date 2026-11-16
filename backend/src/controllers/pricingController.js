const pricingService = require("../services/pricingService");
const { sendSuccess } = require("../utils/responseHandler");

class PricingController {
  async getCurrent(req, res, next) {
    try {
      const pricing = await pricingService.getCurrentPrice(req.query.source || "SOLAR");
      return sendSuccess(res, pricing, "Current dynamic pricing snapshot retrieved");
    } catch (err) {
      next(err);
    }
  }

  async calculate(req, res, next) {
    try {
      const calculation = await pricingService.calculatePriceFormula(req.body);
      return sendSuccess(res, calculation, "Dynamic price calculated successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const history = await pricingService.getPricingHistory(limit);
      return sendSuccess(res, history, "Pricing history retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PricingController();
