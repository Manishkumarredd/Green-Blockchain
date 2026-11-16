const adminService = require("../services/adminService");
const { sendSuccess } = require("../utils/responseHandler");

class AdminController {
  /**
   * GET /api/admin/dashboard
   */
  async getDashboard(req, res, next) {
    try {
      const stats = await adminService.getAdminDashboardStats();
      return sendSuccess(res, stats, "Admin dashboard KPI metrics retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const result = await adminService.getAllUsers(req.query);
      return sendSuccess(res, result, "Platform user accounts retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await adminService.getUserById(req.params.id);
      return sendSuccess(res, user, "User account profile retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   */
  async updateUserStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const adminUserId = req.user.id;
      const updated = await adminService.updateUserStatus(adminUserId, req.params.id, status, reason);
      return sendSuccess(res, updated, `User account status successfully updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/listings
   */
  async getListings(req, res, next) {
    try {
      const result = await adminService.getAllListings(req.query);
      return sendSuccess(res, result, "All marketplace energy listings retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/listings/:id/status
   */
  async updateListingStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const adminUserId = req.user.id;
      const updated = await adminService.updateListingStatus(adminUserId, req.params.id, status, reason);
      return sendSuccess(res, updated, `Listing #${req.params.id} status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/requests
   */
  async getRequests(req, res, next) {
    try {
      const result = await adminService.getAllRequests(req.query);
      return sendSuccess(res, result, "All consumer energy requests retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/transactions
   */
  async getTransactions(req, res, next) {
    try {
      const result = await adminService.getAllTransactions(req.query);
      return sendSuccess(res, result, "All platform transactions retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/settings
   */
  async getSettings(req, res, next) {
    try {
      const settings = await adminService.getPlatformSettings();
      return sendSuccess(res, settings, "Platform configuration settings retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/settings
   */
  async updateSettings(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const updates = req.body.settings || (req.body.key ? { [req.body.key]: req.body.value } : req.body);
      const settings = await adminService.updatePlatformSettings(adminUserId, updates);
      return sendSuccess(res, settings, "Platform configuration updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/activity-logs
   */
  async getActivityLogs(req, res, next) {
    try {
      const result = await adminService.getActivityLogs(req.query);
      return sendSuccess(res, result, "Platform audit trail activity logs retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/research-analytics
   */
  async getResearchAnalytics(req, res, next) {
    try {
      const result = await adminService.getResearchAnalytics(req.query);
      return sendSuccess(res, result, "Research benchmark analytics retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/research-analytics/export
   */
  async exportResearchAnalyticsCsv(req, res, next) {
    try {
      const csv = await adminService.exportResearchAnalyticsCsv();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=greenledger_research_benchmarks_${Date.now()}.csv`);
      return res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
