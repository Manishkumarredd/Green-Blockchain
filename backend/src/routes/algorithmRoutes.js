const express = require("express");
const router = express.Router();
const algorithmController = require("../controllers/algorithmController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");

router.use(authenticateToken);

// Read-only endpoints accessible to all authenticated roles
router.get("/pricing", algorithmController.getPricing);
router.get("/experiments", algorithmController.getExperiments);
router.get("/compare", algorithmController.compare);
router.get("/results/:id", algorithmController.getResultById);
router.get("/metrics/:id", algorithmController.getMetricsById);

// Operations for executing matching and global allocation (Admin-only for live DB state updates)
router.post("/match", requireRoles("ADMIN"), algorithmController.match);
router.post("/allocate", requireRoles("ADMIN"), algorithmController.allocate);
// Experiment simulations: accessible to all verified roles for research benchmarking
router.post("/experiments/run", requireRoles("ADMIN", "PRODUCER", "CONSUMER"), algorithmController.runExperiment);

module.exports = router;
