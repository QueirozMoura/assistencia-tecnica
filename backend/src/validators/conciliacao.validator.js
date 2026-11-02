import { z } from "zod";
import { STATUS, STATUS_FINAIS, TIPOS, VERIFICACOES } from "../services/conciliacao.service.js";

export const conciliacaoQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(STATUS).optional(),
  tipo: z.enum(Object.values(TIPOS)).optional(),
  verificacao: z.enum(VERIFICACOES).optional(),
  pedidoId: z.coerce.number().int().positive().optional(),
});

// A final status needs a written justification (e.g. the manual refund reference). Never paste card or payer data.
export const conciliacaoStatusSchema = z.object({
  status: z.enum(STATUS).refine(status => status !== "PENDENTE", "Uma pendência não volta para PENDENTE."),
  observacao: z.string().trim().max(1000, "Observação muito longa.").optional().nullable(),
}).superRefine((value, ctx) => {
  if (STATUS_FINAIS.includes(value.status) && (value.observacao ?? "").length < 3) {
    ctx.addIssue({ code: "custom", path: ["observacao"], message: "Informe a justificativa da resolução (mínimo 3 caracteres)." });
  }
});
