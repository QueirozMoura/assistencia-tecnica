import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { adminLoginLimiter } from "../middlewares/authRateLimit.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

// POST /api/auth/login
router.post("/login", adminLoginLimiter, validate(loginSchema), authController.login);

// POST /api/auth/register — apenas ADMIN pode criar novos usuários
router.post(
  "/register",
  authMiddleware,
  adminMiddleware,
  validate(registerSchema),
  authController.register
);

// POST /api/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/auth/logout
router.post("/logout", authController.logout);

// GET /api/auth/me
router.get("/me", authMiddleware, authController.getMe);

export default router;
