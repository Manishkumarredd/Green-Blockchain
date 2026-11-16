const express = require("express");
const router = express.Router();
const consumerController = require("../controllers/consumerController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { createRequestSchema } = require("../validators/schemas");

router.use(authenticateToken);
router.use(requireRoles("CONSUMER"));

router.post("/requests", validate(createRequestSchema), consumerController.createRequest);
router.get("/requests", consumerController.getMyRequests);
router.get("/allocations", consumerController.getMyAllocations);
router.get("/dashboard", consumerController.getDashboard);

module.exports = router;
