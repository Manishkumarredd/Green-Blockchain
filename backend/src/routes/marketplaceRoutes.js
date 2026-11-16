const express = require("express");
const router = express.Router();
const marketplaceController = require("../controllers/marketplaceController");
const { validate } = require("../middleware/validationMiddleware");
const { queryMarketplaceSchema } = require("../validators/schemas");

router.get("/listings", validate(queryMarketplaceSchema, "query"), marketplaceController.getListings);
router.get("/listings/:id", marketplaceController.getListingById);

module.exports = router;
