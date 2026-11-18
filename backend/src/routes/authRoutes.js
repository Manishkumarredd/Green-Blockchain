const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const { registerSchema, loginSchema } = require("../validators/schemas");

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/switch-role", authController.switchRole);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.me);

module.exports = router;
