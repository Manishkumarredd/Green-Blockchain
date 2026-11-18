const express = require("express");
const router = express.Router();
const producerController = require("../controllers/producerController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { createListingSchema, updateListingSchema } = require("../validators/schemas");

router.use(authenticateToken);
router.use(requireRoles("PRODUCER", "ADMIN"));

router.post("/listings", validate(createListingSchema), producerController.createListing);
router.get("/listings", producerController.getMyListings);
router.get("/listings/:id", producerController.getListingById);
router.put("/listings/:id", validate(updateListingSchema), producerController.updateListing);
router.delete("/listings/:id", producerController.deleteListing);
router.get("/dashboard", producerController.getDashboard);

// Producer incoming consumer requests management & acceptance
router.get("/requests", producerController.getIncomingRequests);
router.post("/requests/:id/accept", producerController.acceptRequest);
router.post("/requests/:id/reject", producerController.rejectRequest);

module.exports = router;
