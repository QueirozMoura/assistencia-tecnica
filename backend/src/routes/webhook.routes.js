import { Router } from "express";
import { mercadoPagoWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// POST /api/webhook/mercadopago — público (legado)
router.post("/mercadopago", mercadoPagoWebhook);

// POST /api/webhooks/mercadopago — público (novo padrão)
router.post("/webhooks/mercadopago", mercadoPagoWebhook);

export default router;
