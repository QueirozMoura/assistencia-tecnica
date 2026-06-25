import * as produtoService from "../services/produto.service.js";
import { produtoQuerySchema } from "../validators/produto.validator.js";

export async function listarProdutos(req, res, next) {
  try {
    const query = produtoQuerySchema.parse(req.query);
    const result = await produtoService.listarProdutos(query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function buscarProdutoPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const produto = await produtoService.buscarProdutoPorId(id);
    return res.status(200).json({ success: true, data: produto });
  } catch (error) {
    next(error);
  }
}

export async function buscarProdutoPorSlug(req, res, next) {
  try {
    const produto = await produtoService.buscarProdutoPorSlug(req.params.slug);
    return res.status(200).json({ success: true, data: produto });
  } catch (error) {
    next(error);
  }
}

export async function buscarProdutosDestaque(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const produtos = await produtoService.buscarProdutosDestaque(limit);
    return res.status(200).json({ success: true, data: produtos });
  } catch (error) {
    next(error);
  }
}

export async function buscarProdutosRelacionados(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const limit = parseInt(req.query.limit) || 4;
    const produtos = await produtoService.buscarProdutosRelacionados(id, limit);
    return res.status(200).json({ success: true, data: produtos });
  } catch (error) {
    next(error);
  }
}

export async function criarProduto(req, res, next) {
  try {
    const produto = await produtoService.criarProduto(req.body);
    return res.status(201).json({ success: true, data: produto });
  } catch (error) {
    next(error);
  }
}

export async function atualizarProduto(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const produto = await produtoService.atualizarProduto(id, req.body);
    return res.status(200).json({ success: true, data: produto });
  } catch (error) {
    next(error);
  }
}

export async function deletarProduto(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    await produtoService.deletarProduto(id);
    return res.status(200).json({ success: true, message: "Produto excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}
