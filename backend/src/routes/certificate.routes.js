const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificate.controller");

router.get("/", certificateController.getCertificates);
router.get("/verify/:tokenId", certificateController.verifyCertificate);
router.get("/calculate-offsets", certificateController.calculateOffsets);

module.exports = router;
