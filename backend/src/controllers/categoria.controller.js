import * as categoriaService from "../services/categoria.service.js";

export async function listarCategorias(req, res, next) {
  try {
    const ativo = req.query.ativo !== undefined ? req.query.ativo === "true" : undefined;
    const categorias = await categoriaService.listarCategorias({ ativo });
    return res.status(200).json({ success: true, data: categorias });
  } catch (error) {
    next(error);
  }
}

export async function buscarCategoriaPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const categoria = await categoriaService.buscarCategoriaPorId(id);
    return res.status(200).json({ success: true, data: categoria });
  } catch (error) {
    next(error);
  }
}

export async function buscarCategoriaPorSlug(req, res, next) {
  try {
    const categoria = await categoriaService.buscarCategoriaPorSlug(req.params.slug);
    return res.status(200).json({ success: true, data: categoria });
  } catch (error) {
    next(error);
  }
}

export async function criarCategoria(req, res, next) {
  try {
    const categoria = await categoriaService.criarCategoria(req.body);
    return res.status(201).json({ success: true, data: categoria });
  } catch (error) {
    next(error);
  }
}

export async function atualizarCategoria(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const categoria = await categoriaService.atualizarCategoria(id, req.body);
    return res.status(200).json({ success: true, data: categoria });
  } catch (error) {
    next(error);
  }
}

export async function deletarCategoria(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    await categoriaService.deletarCategoria(id);
    return res.status(200).json({ success: true, message: "Categoria excluída com sucesso." });
  } catch (error) {
    next(error);
  }
}
