const express = require("express");
const router = express.Router();
const settlementController = require("../controllers/settlement.controller");
const { authenticateToken, requireRoles } = require("../middleware/auth");

router.post("/match", authenticateToken, requireRoles("ADMIN"), settlementController.executeMatchingCycle);
router.get("/history", authenticateToken, settlementController.getSettlements);

module.exports = router;
