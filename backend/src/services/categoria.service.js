import prisma from "../config/prisma.js";
import { slugify } from "../utils/slugify.js";

export async function listarCategorias({ ativo } = {}) {
  const where = {};
  if (ativo !== undefined) where.ativo = ativo;

  return prisma.categoria.findMany({
    where,
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { produtos: true } },
    },
  });
}

export async function buscarCategoriaPorId(id) {
  const categoria = await prisma.categoria.findUnique({
    where: { id },
    include: {
      _count: { select: { produtos: true } },
    },
  });

  if (!categoria) {
    throw Object.assign(new Error("Categoria não encontrada."), { statusCode: 404 });
  }

  return categoria;
}

export async function buscarCategoriaPorSlug(slug) {
  const categoria = await prisma.categoria.findUnique({
    where: { slug },
    include: {
      _count: { select: { produtos: true } },
    },
  });

  if (!categoria) {
    throw Object.assign(new Error("Categoria não encontrada."), { statusCode: 404 });
  }

  return categoria;
}

export async function criarCategoria(dados) {
  const { nome, slug, descricao, imagem, ativo } = dados;
  const slugFinal = slug || slugify(nome);

  return prisma.categoria.create({
    data: { nome, slug: slugFinal, descricao, imagem, ativo },
  });
}

export async function atualizarCategoria(id, dados) {
  await buscarCategoriaPorId(id);

  const updateData = { ...dados };
  if (dados.nome && !dados.slug) {
    updateData.slug = slugify(dados.nome);
  }

  return prisma.categoria.update({
    where: { id },
    data: updateData,
  });
}

export async function deletarCategoria(id) {
  await buscarCategoriaPorId(id);

  const produtosVinculados = await prisma.produto.count({
    where: { categoriaId: id },
  });

  if (produtosVinculados > 0) {
    throw Object.assign(
      new Error(`Não é possível excluir. Existem ${produtosVinculados} produto(s) nesta categoria.`),
      { statusCode: 409 }
    );
  }

  return prisma.categoria.delete({ where: { id } });
}
