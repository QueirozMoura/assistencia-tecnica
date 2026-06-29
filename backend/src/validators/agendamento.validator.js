import { z } from "zod";

export const agendamentoSchema = z.object({
  nomeContato: z
    .string({ required_error: "Nome é obrigatório." })
    .min(2, "Nome deve ter no mínimo 2 caracteres.")
    .trim(),
  telefoneContato: z
    .string({ required_error: "Telefone é obrigatório." })
    .regex(
      /^(\+55\s?)?(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/,
      "Telefone inválido. Use o formato (11) 99999-9999."
    )
    .trim(),
  email: z.string().email("E-mail inválido.").trim().optional().nullable(),
  whatsapp: z
    .string()
    .regex(
      /^(\+55\s?)?(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/,
      "WhatsApp inválido. Use o formato (11) 99999-9999."
    )
    .trim()
    .optional()
    .nullable(),
  endereco: z.string().trim().optional().nullable(),
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Use o formato 00000-000.")
    .trim()
    .optional()
    .nullable(),
  cidade: z.string().trim().optional().nullable(),
  equipamento: z
    .string({ required_error: "Equipamento é obrigatório." })
    .min(2, "Informe o tipo de equipamento.")
    .trim(),
  marca: z.string().trim().optional().nullable(),
  modelo: z.string().trim().optional().nullable(),
  problema: z
    .string({ required_error: "Descrição do problema é obrigatória." })
    .min(10, "Descreva o problema com pelo menos 10 caracteres.")
    .trim(),
  observacoes: z.string().trim().optional().nullable(),
  melhorHorario: z.string().trim().optional().nullable(),
  dataAgendamento: z
    .string()
    .datetime({ message: "Data de agendamento inválida. Use o formato ISO 8601." })
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  clienteId: z.number().int().positive().optional().nullable(),
});

export const agendamentoUpdateSchema = agendamentoSchema.partial();

export const agendamentoStatusSchema = z.object({
  status: z.enum(
    ["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"],
    { required_error: "Status é obrigatório." }
  ),
});

export const agendamentoQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z
    .enum(["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"])
    .optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  busca: z.string().trim().optional(),
});
