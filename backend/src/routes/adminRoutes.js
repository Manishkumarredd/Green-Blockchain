const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { updateSettingSchema } = require("../validators/schemas");

router.use(authenticateToken);
router.use(requireRoles("ADMIN"));

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);
router.get("/transactions", adminController.getTransactions);
router.get("/listings", adminController.getListings);
router.put("/settings", validate(updateSettingSchema), adminController.updateSetting);

module.exports = router;
