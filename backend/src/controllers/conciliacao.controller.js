import * as service from "../services/conciliacao.service.js";
import { conciliacaoQuerySchema, conciliacaoStatusSchema } from "../validators/conciliacao.validator.js";

const parseId = req => {
  const id = Number(req.params.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export async function listar(req, res, next) {
  try { return res.status(200).json({ success: true, ...(await service.listarPendencias(conciliacaoQuerySchema.parse(req.query))) }); }
  catch (error) { next(error); }
}
export async function resumo(_req, res, next) {
  try { return res.status(200).json({ success: true, data: await service.resumoPendencias() }); }
  catch (error) { next(error); }
}
export async function buscar(req, res, next) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ success: false, message: "ID inválido." });
    return res.status(200).json({ success: true, data: await service.buscarPendencia(id) });
  } catch (error) { next(error); }
}
export async function atualizarStatus(req, res, next) {
  try {
    const id = parseId(req);
    if (!id) return res.status(400).json({ success: false, message: "ID inválido." });
    const data = await service.atualizarStatusPendencia(id, conciliacaoStatusSchema.parse(req.body), req.usuario.id);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
}
