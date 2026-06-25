import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // ─── USUÁRIO ADMIN ───────────────────────────────────────────────
  const senhaHash = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@assistencia.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@assistencia.com",
      senha: senhaHash,
      role: "ADMIN",
      ativo: true,
    },
  });
  console.log(`✅ Usuário admin criado: ${admin.email}`);

  const tecnicoHash = await bcrypt.hash("Tecnico@123", 12);
  const tecnico = await prisma.usuario.upsert({
    where: { email: "tecnico@assistencia.com" },
    update: {},
    create: {
      nome: "João Técnico",
      email: "tecnico@assistencia.com",
      senha: tecnicoHash,
      role: "TECNICO",
      ativo: true,
    },
  });
  console.log(`✅ Usuário técnico criado: ${tecnico.email}`);

  // ─── CATEGORIAS ──────────────────────────────────────────────────
  const categorias = [
    {
      nome: "Máquinas de Lavar",
      slug: "maquinas-de-lavar",
      descricao: "Máquinas de lavar roupas das melhores marcas",
      ativo: true,
    },
    {
      nome: "Lava e Seca",
      slug: "lava-e-seca",
      descricao: "Lava e seca com tecnologia avançada",
      ativo: true,
    },
    {
      nome: "Micro-ondas",
      slug: "micro-ondas",
      descricao: "Micro-ondas para todos os tamanhos de família",
      ativo: true,
    },
    {
      nome: "Centrífugas",
      slug: "centrifugas",
      descricao: "Centrífugas de alta performance",
      ativo: true,
    },
    {
      nome: "Peças e Acessórios",
      slug: "pecas-e-acessorios",
      descricao: "Peças originais e acessórios para eletrodomésticos",
      ativo: true,
    },
  ];

  const categoriasCreated = [];
  for (const cat of categorias) {
    const categoria = await prisma.categoria.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categoriasCreated.push(categoria);
    console.log(`✅ Categoria criada: ${categoria.nome}`);
  }

  // ─── PRODUTOS ────────────────────────────────────────────────────
  const catMaquina = categoriasCreated.find((c) => c.slug === "maquinas-de-lavar");
  const catLavaSeca = categoriasCreated.find((c) => c.slug === "lava-e-seca");
  const catMicroondas = categoriasCreated.find((c) => c.slug === "micro-ondas");
  const catCentrifuga = categoriasCreated.find((c) => c.slug === "centrifugas");

  const produtos = [
    {
      nome: "Máquina de Lavar Brastemp 11kg Inox",
      slug: "maquina-lavar-brastemp-11kg-inox",
      descricao: "Máquina de lavar com 11kg de capacidade, painel digital e 12 programas de lavagem.",
      preco: 1899.99,
      precoPromocional: 1699.99,
      estoque: 15,
      sku: "BWK11AB",
      destaque: true,
      ativo: true,
      categoriaId: catMaquina.id,
    },
    {
      nome: "Máquina de Lavar Consul 10kg Branca",
      slug: "maquina-lavar-consul-10kg-branca",
      descricao: "Máquina de lavar com 10kg, tecnologia Dosagem Econômica e 8 programas.",
      preco: 1499.99,
      estoque: 20,
      sku: "CWB10AB",
      destaque: false,
      ativo: true,
      categoriaId: catMaquina.id,
    },
    {
      nome: "Lava e Seca Samsung 11kg Inox",
      slug: "lava-seca-samsung-11kg-inox",
      descricao: "Lava e seca com tecnologia EcoBubble, 11kg de capacidade e Wi-Fi integrado.",
      preco: 3299.99,
      precoPromocional: 2999.99,
      estoque: 8,
      sku: "WD11T504DBX",
      destaque: true,
      ativo: true,
      categoriaId: catLavaSeca.id,
    },
    {
      nome: "Lava e Seca LG 12kg Inox",
      slug: "lava-seca-lg-12kg-inox",
      descricao: "Lava e seca com motor inverter, 12kg e tecnologia AI DD.",
      preco: 3799.99,
      estoque: 5,
      sku: "WD12VC6D2BA",
      destaque: true,
      ativo: true,
      categoriaId: catLavaSeca.id,
    },
    {
      nome: "Micro-ondas Electrolux 31L Inox",
      slug: "micro-ondas-electrolux-31l-inox",
      descricao: "Micro-ondas com 31 litros, 10 níveis de potência e função grill.",
      preco: 699.99,
      precoPromocional: 599.99,
      estoque: 30,
      sku: "MEF41",
      destaque: false,
      ativo: true,
      categoriaId: catMicroondas.id,
    },
    {
      nome: "Micro-ondas Panasonic 32L Branco",
      slug: "micro-ondas-panasonic-32l-branco",
      descricao: "Micro-ondas com 32 litros, tecnologia Inverter e 11 níveis de potência.",
      preco: 799.99,
      estoque: 25,
      sku: "NN-ST65LBRU",
      destaque: true,
      ativo: true,
      categoriaId: catMicroondas.id,
    },
    {
      nome: "Centrífuga Consul 10kg Branca",
      slug: "centrifuga-consul-10kg-branca",
      descricao: "Centrífuga com 10kg de capacidade, timer e tampa de segurança.",
      preco: 499.99,
      precoPromocional: 449.99,
      estoque: 18,
      sku: "CE10AB",
      destaque: false,
      ativo: true,
      categoriaId: catCentrifuga.id,
    },
    {
      nome: "Centrífuga Brastemp 10kg Inox",
      slug: "centrifuga-brastemp-10kg-inox",
      descricao: "Centrífuga com 10kg, design inox e sistema de segurança automático.",
      preco: 599.99,
      estoque: 12,
      sku: "BCF10AB",
      destaque: true,
      ativo: true,
      categoriaId: catCentrifuga.id,
    },
  ];

  for (const prod of produtos) {
    const produto = await prisma.produto.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
    console.log(`✅ Produto criado: ${produto.nome}`);
  }

  // ─── CLIENTE DE EXEMPLO ──────────────────────────────────────────
  const cliente = await prisma.cliente.upsert({
    where: { email: "cliente@exemplo.com" },
    update: {},
    create: {
      nome: "Maria Silva",
      email: "cliente@exemplo.com",
      telefone: "(11) 99999-9999",
      cpf: "123.456.789-09",
    },
  });
  console.log(`✅ Cliente criado: ${cliente.nome}`);

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de acesso:");
  console.log("   Admin:   admin@assistencia.com  / Admin@123");
  console.log("   Técnico: tecnico@assistencia.com / Tecnico@123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
