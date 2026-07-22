import * as agendamentoService from "../services/agendamento.service.js";
import { agendamentoQuerySchema } from "../validators/agendamento.validator.js";

export async function listarAgendamentos(req, res, next) {
  try {
    const query = agendamentoQuerySchema.parse(req.query);
    const result = await agendamentoService.listarAgendamentos(query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function buscarAgendamentoPorId(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const agendamento = await agendamentoService.buscarAgendamentoPorId(id);
    return res.status(200).json({ success: true, data: agendamento });
  } catch (error) {
    next(error);
  }
}

export async function criarAgendamento(req, res, next) {
  try {
    const dadosAgendamento = {
      ...req.body,
      clienteId: req.cliente?.id ?? null,
    };

    const agendamento = await agendamentoService.criarAgendamento(dadosAgendamento);
    return res.status(201).json({ success: true, data: agendamento });
  } catch (error) {
    next(error);
  }
}

export async function atualizarAgendamento(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const agendamento = await agendamentoService.atualizarAgendamento(id, req.body);
    return res.status(200).json({ success: true, data: agendamento });
  } catch (error) {
    next(error);
  }
}

export async function atualizarStatusAgendamento(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    const { status } = req.body;
    const agendamento = await agendamentoService.atualizarStatusAgendamento(id, status);
    return res.status(200).json({ success: true, data: agendamento });
  } catch (error) {
    next(error);
  }
}

export async function deletarAgendamento(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
    await agendamentoService.deletarAgendamento(id);
    return res.status(200).json({ success: true, message: "Agendamento excluído com sucesso." });
  } catch (error) {
    next(error);
  }
}
