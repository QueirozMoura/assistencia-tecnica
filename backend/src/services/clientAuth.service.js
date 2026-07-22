import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import prisma from "../config/prisma.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service.js";

const SALT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function generateClientToken(cliente) {
  const secret = process.env.JWT_CLIENT_SECRET;
  if (!secret) throw new Error("JWT_CLIENT_SECRET não configurado.");
  return jwt.sign(
    { id: cliente.id, email: cliente.email, type: "client" },
    secret,
    { expiresIn: process.env.JWT_CLIENT_EXPIRES_IN || "7d" }
  );
}

function safeCliente(c) {
  const { senha, resetToken, resetTokenExpiry, verifyToken, googleId, ...safe } = c;
  return safe;
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register({ nome, email, telefone, senha }) {
  const emailNormalizado = normalizeEmail(email);
  const existe = await prisma.cliente.findUnique({ where: { email: emailNormalizado } });
  if (existe) {
    throw Object.assign(new Error("E-mail já cadastrado."), { statusCode: 409 });
  }

  const senhaHash  = await bcrypt.hash(senha, SALT_ROUNDS);
  const verifyToken = randomToken();

  const cliente = await prisma.cliente.create({
    data: { nome, email: emailNormalizado, telefone, senha: senhaHash, verifyToken, emailVerificado: false },
  });

  // Enviar email de verificação (falha silenciosa)
  await sendVerificationEmail(email, nome, verifyToken);

  const token = generateClientToken(cliente);
  return { token, cliente: safeCliente(cliente) };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(email, senha) {
  const emailNormalizado = normalizeEmail(email);
  const cliente = await prisma.cliente.findUnique({ where: { email: emailNormalizado } });

  if (!cliente || !cliente.senha) {
    throw Object.assign(
      new Error("Credenciais inválidas."),
      { statusCode: 401 }
    );
  }

  const senhaValida = await bcrypt.compare(senha, cliente.senha);
  if (!senhaValida) {
    throw Object.assign(new Error("Credenciais inválidas."), { statusCode: 401 });
  }

  const token = generateClientToken(cliente);
  return { token, cliente: safeCliente(cliente) };
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

export async function googleAuth({ idToken, code }) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw Object.assign(new Error("GOOGLE_CLIENT_ID não configurado."), { statusCode: 500 });
  }

  const oAuth2Client = new OAuth2Client(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  let tokenToVerify = idToken;

  // Compatibilidade com fluxo antigo por code
  if (!tokenToVerify && code) {
    const { tokens } = await oAuth2Client.getToken(code);
    tokenToVerify = tokens?.id_token;
  }

  if (!tokenToVerify) {
    throw Object.assign(new Error("Token do Google inválido."), { statusCode: 400 });
  }

  let payload;
  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokenToVerify,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (_error) {
    throw Object.assign(new Error("Token do Google inválido."), { statusCode: 401 });
  }
  if (!payload?.sub || !payload?.email) {
    throw Object.assign(new Error("Dados do usuário Google inválidos."), { statusCode: 400 });
  }

  const { sub: googleId, email, name: nome } = payload;
  const emailNormalizado = normalizeEmail(email);

  let cliente = await prisma.cliente.findFirst({
    where: { OR: [{ googleId }, { email: emailNormalizado }] },
  });

  if (cliente) {
    if (!cliente.googleId || !cliente.emailVerificado) {
      cliente = await prisma.cliente.update({
        where: { id: cliente.id },
        data: { googleId, emailVerificado: true },
      });
    }
  } else {
    cliente = await prisma.cliente.create({
      data: {
        nome: nome || email.split("@")[0],
        email: emailNormalizado,
        telefone: "",
        googleId,
        emailVerificado: true,
      },
    });
  }

  const token = generateClientToken(cliente);
  return { token, cliente: safeCliente(cliente) };
}

// ── Verify Email ──────────────────────────────────────────────────────────────

export async function verifyEmail(token) {
  const cliente = await prisma.cliente.findFirst({
    where: { verifyToken: token },
  });

  if (!cliente) {
    throw Object.assign(new Error("Token de verificação inválido."), { statusCode: 400 });
  }

  await prisma.cliente.update({
    where: { id: cliente.id },
    data:  { emailVerificado: true, verifyToken: null },
  });

  return { message: "E-mail verificado com sucesso." };
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export async function forgotPassword(email) {
  const emailNormalizado = normalizeEmail(email);
  console.log("=== forgotPassword ===");
  console.log("Email recebido:", emailNormalizado);

  const cliente = await prisma.cliente.findUnique({ where: { email: emailNormalizado } });
  console.log("Cliente encontrado:", !!cliente);

  if (cliente) {
    console.log("Cliente ID:", cliente.id);
  }

  // Resposta genérica — não revela se o email existe
  if (!cliente || !cliente.senha) {
    return { message: "Se o e-mail estiver cadastrado, você receberá as instruções em breve." };
  }

  const resetToken  = randomToken();
  console.log("Token de recuperação gerado.");

  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  console.log("Antes do prisma.update de recuperação de senha");
  console.log("resetToken gerado:", !!resetToken);
  console.log("resetTokenExpiry:", resetExpiry);
  await prisma.cliente.update({
    where: { id: cliente.id },
    data:  { resetToken, resetTokenExpiry: resetExpiry },
  });
  console.log("Depois do prisma.update de recuperação de senha");

  console.log("Token salvo no banco com sucesso.");
  console.log("Antes de chamar sendPasswordResetEmail");
  await sendPasswordResetEmail(emailNormalizado, cliente.nome, resetToken);
  console.log("Depois de chamar sendPasswordResetEmail");

  return { message: "Se o e-mail estiver cadastrado, você receberá as instruções em breve." };
}

// ── Reset Password ────────────────────────────────────────────────────────────

export async function resetPassword(token, novaSenha) {
  const cliente = await prisma.cliente.findFirst({
    where: {
      resetToken:       token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!cliente) {
    throw Object.assign(
      new Error("Token inválido ou expirado. Solicite um novo link."),
      { statusCode: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

  await prisma.cliente.update({
    where: { id: cliente.id },
    data:  { senha: senhaHash, resetToken: null, resetTokenExpiry: null },
  });

  return { message: "Senha redefinida com sucesso." };
}

// ── Get Me ────────────────────────────────────────────────────────────────────

export async function getMe(id) {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    select: {
      id: true, nome: true, email: true, telefone: true,
      cpf: true, emailVerificado: true, createdAt: true,
      _count: { select: { pedidos: true, agendamentos: true } },
    },
  });

  if (!cliente) {
    throw Object.assign(new Error("Cliente não encontrado."), { statusCode: 404 });
  }

  return cliente;
}
