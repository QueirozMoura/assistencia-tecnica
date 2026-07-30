import * as pedidoService from "../services/pedido.service.js";
import logger from "../config/logger.js";
import { pedidoQuerySchema } from "../validators/pedido.validator.js";

export async function listarPedidos(req, res, next) {
  try {
    const query = pedidoQuerySchema.parse(req.query);
    const result = await pedidoService.listarPedidos(query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function buscarPedidoPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const pedido = await pedidoService.buscarPedidoPorId(id);
    return res.status(200).json({ success: true, data: pedido });
  } catch (error) {
    next(error);
  }
}

export async function criarPedido(req, res, next) {
  try {
    const pedido = await pedidoService.criarPedido({
      ...req.body,
      clienteAutenticadoId: req.cliente?.id ?? null,
    });
    return res.status(201).json({ success: true, data: pedido });
  } catch (error) {
    next(error);
  }
}

export async function criarPedidoComPagamento(req, res, next) {
  try {
    const result = await pedidoService.criarPedidoComPagamento({
      ...req.body,
      clienteAutenticadoId: req.cliente?.id ?? null,
    });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    logger.error("ERRO CRIAR PEDIDO COM PAGAMENTO", {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    });
    next(error);
  }
}

export async function atualizarStatusPedido(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const { status } = req.body;
    const pedido = await pedidoService.atualizarStatusPedido(id, status);
    return res.status(200).json({ success: true, data: pedido });
  } catch (error) {
    next(error);
  }
}

export async function deletarPedido(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    await pedidoService.deletarPedido(id);
    return res
      .status(200)
      .json({ success: true, message: "Pedido excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}

export async function buscarPedidoSucesso(req, res, next) {
  try {
    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Token de acesso inválido.",
      });
    }

    const pedido = await pedidoService.buscarPedidoSucessoPorToken(token);

    return res.status(200).json({
      success: true,
      data: pedido,
    });
  } catch (error) {
    next(error);
  }
}
