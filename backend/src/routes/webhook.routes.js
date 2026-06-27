import { Router } from "express";
import { mercadoPagoWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// POST /api/webhook/mercadopago — público
router.post("/mercadopago", mercadoPagoWebhook);

export default router;
