const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/auth");

// Public authentication routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/nonce", authController.requestNonce);
router.post("/forgot-password", authController.forgotPassword);

// Protected routes
router.get("/me", authenticateToken, authController.getProfile);

module.exports = router;
