const carbonService = require("../services/carbonService");
const { sendSuccess } = require("../utils/responseHandler");

class CarbonController {
  async getSummary(req, res, next) {
    try {
      const summary = await carbonService.getCarbonSummary();
      return sendSuccess(res, summary, "Carbon offset summary retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getMyRecords(req, res, next) {
    try {
      const records = await carbonService.getUserCarbonRecords(req.user.id);
      return sendSuccess(res, records, "User carbon offset records retrieved");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CarbonController();
