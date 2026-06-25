import prisma from "../config/prisma.js";
import { slugify } from "../utils/slugify.js";

export async function listarProdutos(query) {
  const {
    page = 1,
    limit = 12,
    categoriaId,
    categoriaSlug,
    busca,
    precoMin,
    precoMax,
    destaque,
    ativo = true,
    orderBy = "createdAt",
    order = "desc",
  } = query;

  const skip = (page - 1) * limit;

  const where = { ativo };

  if (categoriaId) where.categoriaId = categoriaId;

  if (categoriaSlug) {
    where.categoria = { slug: categoriaSlug };
  }

  if (destaque !== undefined) where.destaque = destaque;

  if (busca) {
    where.OR = [
      { nome: { contains: busca, mode: "insensitive" } },
      { descricao: { contains: busca, mode: "insensitive" } },
      { sku: { contains: busca, mode: "insensitive" } },
      { categoria: { nome: { contains: busca, mode: "insensitive" } } },
    ];
  }

  if (precoMin !== undefined || precoMax !== undefined) {
    where.preco = {};
    if (precoMin !== undefined) where.preco.gte = precoMin;
    if (precoMax !== undefined) where.preco.lte = precoMax;
  }

  const [total, produtos] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderBy]: order },
      include: {
        categoria: { select: { id: true, nome: true, slug: true } },
      },
    }),
  ]);

  return {
    data: produtos,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
}

export async function buscarProdutoPorId(id) {
  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      categoria: { select: { id: true, nome: true, slug: true } },
    },
  });

  if (!produto) {
    throw Object.assign(new Error("Produto não encontrado."), { statusCode: 404 });
  }

  return produto;
}

export async function buscarProdutoPorSlug(slug) {
  const produto = await prisma.produto.findUnique({
    where: { slug },
    include: {
      categoria: { select: { id: true, nome: true, slug: true } },
    },
  });

  if (!produto) {
    throw Object.assign(new Error("Produto não encontrado."), { statusCode: 404 });
  }

  return produto;
}

export async function buscarProdutosDestaque(limit = 8) {
  return prisma.produto.findMany({
    where: { destaque: true, ativo: true },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      categoria: { select: { id: true, nome: true, slug: true } },
    },
  });
}

export async function buscarProdutosRelacionados(produtoId, limit = 4) {
  const produto = await buscarProdutoPorId(produtoId);

  return prisma.produto.findMany({
    where: {
      categoriaId: produto.categoriaId,
      id: { not: produtoId },
      ativo: true,
    },
    take: limit,
    orderBy: { destaque: "desc" },
    include: {
      categoria: { select: { id: true, nome: true, slug: true } },
    },
  });
}

export async function criarProduto(dados) {
  const { nome, slug, ...rest } = dados;
  const slugFinal = slug || slugify(nome);

  return prisma.produto.create({
    data: { nome, slug: slugFinal, ...rest },
    include: {
      categoria: { select: { id: true, nome: true, slug: true } },
    },
  });
}

export async function atualizarProduto(id, dados) {
  await buscarProdutoPorId(id);

  const updateData = { ...dados };
  if (dados.nome && !dados.slug) {
    updateData.slug = slugify(dados.nome);
  }

  return prisma.produto.update({
    where: { id },
    data: updateData,
    include: {
      categoria: { select: { id: true, nome: true, slug: true } },
    },
  });
}

export async function deletarProduto(id) {
  await buscarProdutoPorId(id);

  const emPedidos = await prisma.itensPedido.count({ where: { produtoId: id } });
  if (emPedidos > 0) {
    // Soft delete — apenas desativa
    return prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });
  }

  return prisma.produto.delete({ where: { id } });
}
