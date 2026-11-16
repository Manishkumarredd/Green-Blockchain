const express = require("express");
const router = express.Router();
const carbonController = require("../controllers/carbonController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/summary", carbonController.getSummary);
router.get("/records", authenticateToken, carbonController.getMyRecords);

module.exports = router;
