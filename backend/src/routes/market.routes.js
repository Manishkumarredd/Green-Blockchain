const express = require("express");
const router = express.Router();
const marketController = require("../controllers/market.controller");
const { authenticateToken, requireRoles } = require("../middleware/auth");

router.get("/listings", marketController.getListings);
router.post("/listings", authenticateToken, requireRoles("PRODUCER", "ADMIN"), marketController.createListing);

router.get("/requests", marketController.getRequests);
router.post("/requests", authenticateToken, requireRoles("CONSUMER", "ADMIN"), marketController.createRequest);

router.get("/pricing/quote", marketController.getDynamicPriceQuote);
router.get("/simulation/feed", marketController.getSimulatedFeed);

module.exports = router;
