import rateLimit from "express-rate-limit";
import logger from "../config/logger.js";
import { buildSuspiciousAttemptLog } from "../utils/logSanitizer.js";

function buildHandler(eventName) {
  return (req, res) => {
    logger.warn(
      JSON.stringify(
        buildSuspiciousAttemptLog({
          event: eventName,
          req,
          details: {
            pedidoId: req.params?.pedidoId || null,
            tokenPresent: Boolean(req.query?.token || req.body?.checkoutToken || req.query?.checkoutToken),
          },
        })
      )
    );

    return res.status(429).json({
      success: false,
      message: "Não foi possível processar a solicitação.",
    });
  };
}

export const pedidoSucessoSensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler("SECURITY_RATE_LIMIT_PEDIDO_SUCESSO"),
});

export const criarPreferenciaSensitiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler("SECURITY_RATE_LIMIT_CRIAR_PREFERENCIA"),
});
