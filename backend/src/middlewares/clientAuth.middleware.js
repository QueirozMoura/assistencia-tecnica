import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

/**
 * Middleware de autenticação para clientes do e-commerce.
 * Completamente separado do authMiddleware (admin).
 * Usa JWT_CLIENT_SECRET e popula req.cliente.
 */
export async function clientAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticação não fornecido.",
      });
    }

    const token  = authHeader.split(" ")[1];
    const secret = process.env.JWT_CLIENT_SECRET;

    if (!secret) throw new Error("JWT_CLIENT_SECRET não configurado.");

    const decoded = jwt.verify(token, secret);

    const cliente = await prisma.cliente.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, nome: true, email: true,
        telefone: true, emailVerificado: true,
      },
    });

    if (!cliente) {
      return res.status(401).json({ success: false, message: "Cliente não encontrado." });
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
