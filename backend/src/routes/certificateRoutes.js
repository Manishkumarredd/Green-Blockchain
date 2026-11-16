const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { issueCertificateSchema } = require("../validators/schemas");

// Public verification endpoint
router.get("/verify/:id", certificateController.verifyCertificate);

// Authenticated certificate endpoints
router.get("/", authenticateToken, certificateController.getCertificates);
router.get("/:id", authenticateToken, certificateController.getCertificateById);
router.post("/issue", authenticateToken, validate(issueCertificateSchema), certificateController.issueCertificate);

module.exports = router;
