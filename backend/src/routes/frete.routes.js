import { Router } from "express";
import * as freteController from "../controllers/frete.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { freteCotacaoSchema } from "../validators/frete.validator.js";
import { freteCotacaoLimiter } from "../middlewares/sensitiveRateLimit.middleware.js";

const router = Router();

// POST /api/frete/cotacao — público (consulta antes do checkout; nada é gravado)
router.post("/cotacao", freteCotacaoLimiter, validate(freteCotacaoSchema), freteController.cotacao);

export default router;
