const express = require("express");
const router = express.Router();
const allocationController = require("../controllers/allocationController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { executeAllocationSchema } = require("../validators/schemas");

router.use(authenticateToken);

router.post("/execute", requireRoles("ADMIN"), validate(executeAllocationSchema), allocationController.execute);
router.get("/results", allocationController.getResults);
router.get("/results/:id", allocationController.getResultById);
router.get("/compare", allocationController.compare);

module.exports = router;
