import { Router } from "express";
import * as pagamentoController from "../controllers/pagamento.controller.js";
import { optionalClientAuthMiddleware } from "../middlewares/clientAuth.middleware.js";
import { criarPreferenciaSensitiveLimiter } from "../middlewares/sensitiveRateLimit.middleware.js";

const router = Router();

// POST /api/pagamentos/criar-preferencia/:pedidoId
router.post(
  "/criar-preferencia/:pedidoId",
  criarPreferenciaSensitiveLimiter,
  optionalClientAuthMiddleware,
  pagamentoController.criarPreferencia
);

// POST /api/pagamentos/webhook
router.post("/webhook", pagamentoController.webhookMercadoPago);

export default router;
