const express = require("express");
const router = express.Router();
const pricingController = require("../controllers/pricingController");
const { validate } = require("../middleware/validationMiddleware");
const { calculatePricingSchema } = require("../validators/schemas");

router.get("/current", pricingController.getCurrent);
router.post("/calculate", validate(calculatePricingSchema), pricingController.calculate);
router.get("/history", pricingController.getHistory);

module.exports = router;
