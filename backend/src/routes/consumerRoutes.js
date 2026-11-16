const express = require("express");
const router = express.Router();
const consumerController = require("../controllers/consumerController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { createRequestSchema } = require("../validators/schemas");

router.use(authenticateToken);
router.use(requireRoles("CONSUMER"));

router.get("/dashboard", consumerController.getDashboard);
router.post("/requests", validate(createRequestSchema), consumerController.createRequest);
router.get("/requests", consumerController.getMyRequests);
router.get("/requests/:id", consumerController.getRequestById);
router.patch("/requests/:id/cancel", consumerController.cancelRequest);
router.get("/purchases", consumerController.getMyPurchases);
router.get("/carbon-savings", consumerController.getCarbonSavings);
router.get("/allocations", consumerController.getMyAllocations);

module.exports = router;
