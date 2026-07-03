import logger from "../config/logger.js";

export function errorMiddleware(err, req, res, _next) {
  logger.error("Erro capturado pelo middleware", {
    message: err.message,
    name: err.name,
    code: err.code,
    stack: err.stack,
    path: req.originalUrl,
  });

  // Erros de validação Zod
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos.",
      errors: err.errors.map((e) => ({
        campo: e.path.join("."),
        mensagem: e.message,
      })),
    });
  }

  // Erros do Prisma
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "campo";
    return res.status(409).json({
      success: false,
      message: `Já existe um registro com este ${field}.`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Registro não encontrado.",
    });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Referência inválida. Verifique os IDs informados.",
    });
  }

  // JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado. Faça login novamente.",
    });
  }

  // CORS
  if (err.message && err.message.startsWith("CORS bloqueado")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode === 500
      ? "Erro interno do servidor."
      : err.message || "Erro desconhecido.";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
