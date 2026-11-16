const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticateToken, requireRoles } = require("../middleware/auth");

router.get("/users", authenticateToken, requireRoles("ADMIN"), adminController.getUsers);
router.get("/pricing-parameters", authenticateToken, requireRoles("ADMIN"), adminController.getPricingParameters);
router.get("/stats", adminController.getPlatformStats);

module.exports = router;
