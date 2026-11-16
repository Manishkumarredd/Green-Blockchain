const adminService = require("../services/adminService");
const transactionService = require("../services/transactionService");
const { sendSuccess } = require("../utils/responseHandler");

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const stats = await adminService.getAdminDashboardStats();
      return sendSuccess(res, stats, "Admin dashboard KPI metrics retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsers();
      return sendSuccess(res, users, "Platform user accounts retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const transactions = await transactionService.getAllTransactions();
      return sendSuccess(res, transactions, "All platform transactions retrieved");
    } catch (err) {
      next(err);
    }
  }

  async getListings(req, res, next) {
    try {
      const listings = await adminService.getAllListings();
      return sendSuccess(res, listings, "All marketplace energy listings retrieved");
    } catch (err) {
      next(err);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const updated = await adminService.updatePlatformSetting(req.body.key, req.body.value);
      return sendSuccess(res, updated, "Platform parameter updated successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
