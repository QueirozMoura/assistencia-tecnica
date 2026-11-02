import { Router } from "express";
import * as controller from "../controllers/conciliacao.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();
// Financial reconciliation is restricted to administrators; there is no public or customer access.
router.use(authMiddleware, adminMiddleware);
router.get("/", controller.listar);
router.get("/resumo", controller.resumo);
router.get("/:id", controller.buscar);
router.patch("/:id/status", controller.atualizarStatus);
export default router;
