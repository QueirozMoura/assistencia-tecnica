import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "development" && process.env.DEV_DATABASE_HOST) {
  const hostname = new URL(process.env.DATABASE_URL || "postgresql://invalid").hostname;
  if (hostname !== process.env.DEV_DATABASE_HOST) {
    throw new Error("Banco recusado: destino diferente do banco de desenvolvimento autorizado.");
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
