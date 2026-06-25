import * as clienteService from "../services/cliente.service.js";

export async function listarClientes(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const busca = req.query.busca || undefined;
    const result = await clienteService.listarClientes({ page, limit, busca });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function buscarClientePorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const cliente = await clienteService.buscarClientePorId(id);
    return res.status(200).json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
}

export async function criarCliente(req, res, next) {
  try {
    const cliente = await clienteService.criarCliente(req.body);
    return res.status(201).json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
}

export async function atualizarCliente(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const cliente = await clienteService.atualizarCliente(id, req.body);
    return res.status(200).json({ success: true, data: cliente });
  } catch (error) {
    next(error);
  }
}

export async function deletarCliente(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    await clienteService.deletarCliente(id);
    return res.status(200).json({ success: true, message: "Cliente excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}
