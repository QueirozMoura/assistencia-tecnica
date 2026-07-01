import "dotenv/config";
import app from "./app.js";
import logger from "./config/logger.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 3000;

/**
 * Valida variáveis de ambiente críticas no startup
 */
function validateEnvironmentVariables() {
  const requiredVars = ["JWT_SECRET", "JWT_CLIENT_SECRET"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error(
      `Variáveis de ambiente obrigatórias não configuradas: ${missingVars.join(", ")}`
    );
    process.exit(1);
  }

  logger.info("Variáveis de ambiente validadas com sucesso.");
}

async function bootstrap() {
  try {
    validateEnvironmentVariables();
    await prisma.$connect();
    logger.info("Banco de dados conectado com sucesso.");

    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("Falha ao iniciar o servidor:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("Encerrando servidor...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Encerrando servidor...");
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
