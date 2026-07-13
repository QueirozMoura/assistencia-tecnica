import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const SALT_ROUNDS = 12;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function generateToken(usuario) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado.");

  return jwt.sign(
    { id: usuario.id, email: usuario.email, role: usuario.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

export async function login(email, senha) {
  const emailNormalizado = normalizeEmail(email);

  const usuario = await prisma.usuario.findUnique({
    where: { email: emailNormalizado },
    select: {
      id: true,
      nome: true,
      email: true,
      senha: true,
      role: true,
      ativo: true,
    },
  });

  if (!usuario) {
    throw Object.assign(new Error("Credenciais inválidas."), { statusCode: 401 });
  }

  if (!usuario.ativo) {
    throw Object.assign(new Error("Conta desativada."), { statusCode: 403 });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    throw Object.assign(new Error("Credenciais inválidas."), { statusCode: 401 });
  }

  const token = generateToken(usuario);
  const { senha: _, ...usuarioSemSenha } = usuario;

  return { token, usuario: usuarioSemSenha };
}

export async function register(dados) {
  const { nome, email, senha, role } = dados;
  const emailNormalizado = normalizeEmail(email);

  const existe = await prisma.usuario.findUnique({ where: { email: emailNormalizado } });
  if (existe) {
    throw Object.assign(new Error("E-mail já cadastrado."), { statusCode: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  const usuario = await prisma.usuario.create({
    data: { nome, email: emailNormalizado, senha: senhaHash, role },
    select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
  });

  const token = generateToken(usuario);
  return { token, usuario };
}

export async function getMe(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true, updatedAt: true },
  });

  if (!usuario) {
    throw Object.assign(new Error("Usuário não encontrado."), { statusCode: 404 });
  }

  return usuario;
}
