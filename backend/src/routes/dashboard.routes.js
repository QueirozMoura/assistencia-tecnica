import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { getStats } from "../controllers/dashboard.controller.js";

const router = Router();

/**
 * GET /api/dashboard/stats
 * Retorna totais e métricas para o painel administrativo.
 * Protegido: requer token JWT + role ADMIN
 */
router.get("/stats", authMiddleware, adminMiddleware, getStats);

export default router;
