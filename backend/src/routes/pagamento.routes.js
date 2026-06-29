import { Router } from "express";
import * as pagamentoController from "../controllers/pagamento.controller.js";

const router = Router();

// POST /api/pagamentos/criar-preferencia/:pedidoId
router.post("/criar-preferencia/:pedidoId", pagamentoController.criarPreferencia);

// POST /api/pagamentos/webhook
router.post("/webhook", pagamentoController.webhookMercadoPago);

export default router;
