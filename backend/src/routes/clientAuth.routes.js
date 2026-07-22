import { Router } from "express";
import * as ctrl from "../controllers/clientAuth.controller.js";
import { clientAuthMiddleware } from "../middlewares/clientAuth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  clientRegisterSchema,
  clientLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from "../validators/clientAuth.validator.js";

const router = Router();

// POST /api/client-auth/register
router.post("/register", validate(clientRegisterSchema), ctrl.register);

// POST /api/client-auth/login
router.post("/login", validate(clientLoginSchema), ctrl.login);

// POST /api/client-auth/google
router.post("/google", validate(googleAuthSchema), ctrl.googleAuth);

// GET  /api/client-auth/verify-email?token=...
router.get("/verify-email", ctrl.verifyEmail);

// POST /api/client-auth/forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), ctrl.forgotPassword);

// POST /api/client-auth/reset-password
router.post("/reset-password", validate(resetPasswordSchema), ctrl.resetPassword);

// GET  /api/client-auth/me  (protegido)
router.get("/me", clientAuthMiddleware, ctrl.getMe);

// POST /api/client-auth/create-password (protegido)
router.post("/create-password", clientAuthMiddleware, validate(createPasswordSchema), ctrl.createPassword);

// GET  /api/client-auth/meus-pedidos (protegido)
router.get("/meus-pedidos", clientAuthMiddleware, ctrl.getMeusPedidos);

// GET  /api/client-auth/meus-agendamentos (protegido)
router.get("/meus-agendamentos", clientAuthMiddleware, ctrl.getMeusAgendamentos);

export default router;
