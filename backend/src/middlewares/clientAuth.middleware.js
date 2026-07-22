import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

async function getClienteFromToken(req) {
  const authHeader = req.headers.authorization || req.get("Authorization");

  if (!authHeader || !authHeader.trim().toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.split(" ").pop().trim();
  const secret = process.env.JWT_CLIENT_SECRET;

  if (!secret) throw new Error("JWT_CLIENT_SECRET não configurado.");

  const decoded = jwt.verify(token, secret);

  const cliente = await prisma.cliente.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      emailVerificado: true,
    },
  });

  return cliente;
}

/**
 * Middleware de autenticação para clientes do e-commerce.
 * Completamente separado do authMiddleware (admin).
 * Usa JWT_CLIENT_SECRET e popula req.cliente.
 */
export async function clientAuthMiddleware(req, res, next) {
  try {
    const cliente = await getClienteFromToken(req);

    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticação não fornecido ou cliente não encontrado.",
      });
    }

    req.cliente = cliente;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token inválido ou expirado." });
    }
    next(error);
  }
}

export async function optionalClientAuthMiddleware(req, _res, next) {
  try {
    const cliente = await getClienteFromToken(req);
    if (cliente) req.cliente = cliente;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next();
    }
    next(error);
  }
}
