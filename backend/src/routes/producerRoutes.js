const express = require("express");
const router = express.Router();
const producerController = require("../controllers/producerController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { createListingSchema, updateListingSchema } = require("../validators/schemas");

router.use(authenticateToken);
router.use(requireRoles("PRODUCER"));

router.post("/listings", validate(createListingSchema), producerController.createListing);
router.get("/listings", producerController.getMyListings);
router.get("/listings/:id", producerController.getListingById);
router.put("/listings/:id", validate(updateListingSchema), producerController.updateListing);
router.delete("/listings/:id", producerController.deleteListing);
router.get("/dashboard", producerController.getDashboard);

module.exports = router;
