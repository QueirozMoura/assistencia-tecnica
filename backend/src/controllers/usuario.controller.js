import * as usuarioService from "../services/usuario.service.js";

export async function listarUsuarios(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await usuarioService.listarUsuarios({ page, limit });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function buscarUsuarioPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const usuario = await usuarioService.buscarUsuarioPorId(id);
    return res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
}

export async function criarUsuario(req, res, next) {
  try {
    const usuario = await usuarioService.criarUsuario(req.body);
    return res.status(201).json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
}

export async function atualizarUsuario(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const usuario = await usuarioService.atualizarUsuario(id, req.body);
    return res.status(200).json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
}

export async function alterarSenha(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const { senhaAtual, novaSenha } = req.body;
    const result = await usuarioService.alterarSenha(id, senhaAtual, novaSenha);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function deletarUsuario(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    await usuarioService.deletarUsuario(id, req.usuario.id);
    return res.status(200).json({ success: true, message: "Usuário excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}
