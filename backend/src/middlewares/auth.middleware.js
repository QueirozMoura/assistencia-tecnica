import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticação não fornecido.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET não configurado.");
    }

    const decoded = jwt.verify(token, secret);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { id: true, nome: true, email: true, role: true, ativo: true },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    if (!usuario.ativo) {
      return res.status(403).json({
        success: false,
        message: "Conta desativada. Entre em contato com o administrador.",
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
}
