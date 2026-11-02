import "dotenv/config";
import { randomBytes } from "node:crypto";
import { appendFile, chmod } from "node:fs/promises";
import bcrypt from "bcrypt";
import prisma from "../src/config/prisma.js";

const host = "ep-summer-bar-b8esi79j.c-14.us-east-1.aws.neon.tech";
if (process.env.NODE_ENV !== "development" || new URL(process.env.DATABASE_URL || "postgresql://invalid").hostname !== host) {
  throw new Error("Setup recusado: somente jfq-development e permitido.");
}
try {
  const email = process.env.DEV_ADMIN_EMAIL || "admin@jfq.example.invalid";
  const password = process.env.DEV_ADMIN_PASSWORD || randomBytes(24).toString("base64url");
  if (!process.env.DEV_ADMIN_EMAIL || !process.env.DEV_ADMIN_PASSWORD) {
    await appendFile(".env", `\nDEV_ADMIN_EMAIL=${email}\nDEV_ADMIN_PASSWORD=${password}\n`);
    await chmod(".env", 0o600);
  }
  await prisma.usuario.upsert({
    where: { email }, update: {},
    create: { nome: "Administrador local ficticio", email, senha: await bcrypt.hash(password, 12), role: "ADMIN" },
  });
  const category = await prisma.categoria.upsert({
    where: { slug: "desenvolvimento-ficticio" }, update: {},
    create: { nome: "Desenvolvimento ficticio", slug: "desenvolvimento-ficticio", descricao: "Dados sinteticos locais" },
  });
  await prisma.produto.upsert({
    where: { slug: "produto-demonstracao-local" }, update: {},
    create: { nome: "Produto demonstracao local", slug: "produto-demonstracao-local", preco: 100, estoque: 10, destaque: true, categoriaId: category.id },
  });
  console.log("Admin, categoria e produto ficticios preparados; credenciais somente no .env privado.");
} catch {
  console.error("Setup local falhou; nenhum detalhe sensivel sera exibido.");
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
