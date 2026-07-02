import "dotenv/config";
import dns from "dns";
import app from "./app.js";
import logger from "./config/logger.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 3000;

/**
 * 🔧 Força resolução IPv4 (corrige problemas com Supabase / DNS / Windows)
 */
dns.setDefaultResultOrder("ipv4first");

/**
 * Valida variáveis de ambiente críticas no startup
 */
function validateEnvironmentVariables() {
  const requiredVars = ["JWT_SECRET", "JWT_CLIENT_SECRET"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    logger.error("Variáveis de conexão com o banco não configuradas: DIRECT_URL ou DATABASE_URL devem estar presentes.");
    process.exit(1);
  }

  if (missingVars.length > 0) {
    logger.error(
      `Variáveis de ambiente obrigatórias não configuradas: ${missingVars.join(", ")}`
    );
    process.exit(1);
  }

  logger.info("Variáveis de ambiente validadas com sucesso.");
}

/**
 * Bootstrap do servidor
 */
async function bootstrap() {
  validateEnvironmentVariables();

  // 🔥 IMPORTANTE: não derruba o servidor se o banco falhar
  try {
    await prisma.$connect();
    logger.info("Banco de dados conectado com sucesso.");
  } catch (error) {
    logger.error("⚠️ Falha na conexão com banco (servidor continuará rodando):", error);
  }

  app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
    logger.info(`Ambiente: ${process.env.NODE_ENV || "development"}`);
  });
}

/**
 * Graceful shutdown
 */
async function shutdown(signal) {
  logger.info(`Recebido sinal ${signal}. Encerrando servidor...`);

  try {
    await prisma.$disconnect();
  } catch (err) {
    logger.error("Erro ao desconectar Prisma:", err);
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bootstrap();