import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("Jfq154812*", 12);

  const admin = await prisma.usuario.upsert({
    where: { email: "jqueiroz555@gmail.com" },
    update: {
      senha: senhaHash,
      role: "ADMIN",
      ativo: true,
    },
    create: {
      nome: "Administrador",
      email: "jqueiroz555@gmail.com",
      senha: senhaHash,
      role: "ADMIN",
      ativo: true,
    },
  });

  console.log("✅ Admin criado com senha nova:", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());