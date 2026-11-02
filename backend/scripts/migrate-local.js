import "dotenv/config";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const authorizedHost = "ep-summer-bar-b8esi79j.c-14.us-east-1.aws.neon.tech";
if (process.env.NODE_ENV !== "development" ||
    new URL(process.env.DATABASE_URL || "postgresql://invalid").hostname !== authorizedHost ||
    process.env.DEV_DATABASE_HOST !== authorizedHost) {
  throw new Error("Migracao recusada: destino nao e o projeto jfq-development autorizado.");
}
const prisma = new PrismaClient();
try {
  await prisma.$connect();
  console.log("Destino confirmado: projeto isolado jfq-development; conexao valida.");
} catch {
  console.error("Nao foi possivel validar a conexao de desenvolvimento.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
if (!process.exitCode) {
  const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    encoding: "utf8", env: process.env,
  });
  // Never print a connection string if the CLI includes one in an error.
  const redact = (text = "") => text.replace(/postgres(?:ql)?:\/\/[^\s"']+/g, "[DATABASE_URL REDACTED]");
  process.stdout.write(redact(result.stdout || ""));
  process.stderr.write(redact(result.stderr || ""));
  process.exitCode = result.status ?? 1;
}
