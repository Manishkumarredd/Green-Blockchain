const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  updateSettingSchema,
  updateUserStatusSchema,
  updateListingStatusSchema,
} = require("../validators/schemas");

// All admin routes strictly require JWT authentication and ADMINISTRATOR role
router.use(authenticateToken);
router.use(requireRoles("ADMIN"));

// Dashboard & KPI Analytics
router.get("/dashboard", adminController.getDashboard);

// User Management
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", validate(updateUserStatusSchema), adminController.updateUserStatus);

// Energy Listing Moderation
router.get("/listings", adminController.getListings);
router.patch("/listings/:id/status", validate(updateListingStatusSchema), adminController.updateListingStatus);

// Energy Demands / Requests Management
router.get("/requests", adminController.getRequests);

// P2P Transactions & Settlement Management
router.get("/transactions", adminController.getTransactions);

// Platform Configuration Settings
router.get("/settings", adminController.getSettings);
router.put("/settings", validate(updateSettingSchema), adminController.updateSettings);

// Activity Logs / Audit Trail
router.get("/activity-logs", adminController.getActivityLogs);

// Research Analytics & CSV Export
router.get("/research-analytics", adminController.getResearchAnalytics);
router.get("/research-analytics/export", adminController.exportResearchAnalyticsCsv);

module.exports = router;
