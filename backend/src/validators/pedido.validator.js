import { z } from "zod";
import { normalizarCep } from "../services/frete.service.js";

/**
 * Limites de carrinho (valem para a cotação de frete e para a criação de pedidos, para que
 * o que é cotado seja sempre aceito no pedido): até 50 produtos distintos e 999 unidades por produto.
 */
export const MAX_ITENS_PEDIDO = 50;
export const MAX_QUANTIDADE_POR_ITEM = 999;

/** CEP com ou sem hífen (00000-000 ou 00000000); sempre convertido para 8 dígitos. */
export const cepSchema = z
  .string({ required_error: "CEP é obrigatório." })
  .trim()
  .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Use o formato 00000-000.")
  .transform((cep) => normalizarCep(cep));

export const itemPedidoSchema = z.object({
  produtoId: z
    .number({ required_error: "ID do produto é obrigatório." })
    .int()
    .positive("ID do produto inválido."),
  quantidade: z
    .number({ required_error: "Quantidade é obrigatória." })
    .int()
    .positive("Quantidade deve ser maior que zero.")
    .max(MAX_QUANTIDADE_POR_ITEM, `Quantidade máxima por produto: ${MAX_QUANTIDADE_POR_ITEM}.`),
});

export const pedidoSchema = z.object({
  creationKey: z.string().regex(/^[a-zA-Z0-9_-]{16,128}$/).optional(),
  clienteId: z
    .number({ required_error: "Cliente é obrigatório." })
    .int()
    .positive("ID do cliente inválido."),
  itens: z
    .array(itemPedidoSchema, { required_error: "Itens do pedido são obrigatórios." })
    .min(1, "O pedido deve ter pelo menos um item.")
    .max(MAX_ITENS_PEDIDO, `O pedido pode ter no máximo ${MAX_ITENS_PEDIDO} produtos diferentes.`),
  observacoes: z.string().trim().optional().nullable(),

  nomeDestinatario: z.string().trim().min(1, "Nome do destinatário é obrigatório."),
  telefoneEntrega: z.string().trim().min(1, "Telefone de entrega é obrigatório."),
  cep: cepSchema,
  rua: z.string().trim().min(1, "Rua é obrigatória."),
  numero: z.string().trim().min(1, "Número é obrigatório."),
  complemento: z.string().trim().optional().nullable(),
  bairro: z.string().trim().min(1, "Bairro é obrigatório."),
  cidade: z.string().trim().min(1, "Cidade é obrigatória."),
  estado: z.string().trim().min(1, "Estado é obrigatório."),
});

export const pedidoStatusSchema = z.object({
  status: z.enum(
    ["PENDENTE", "PAGO", "PREPARANDO", "ENVIADO", "ENTREGUE", "CANCELADO"],
    { required_error: "Status é obrigatório." }
  ),
});

export const pedidoQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(["PENDENTE", "PAGO", "PREPARANDO", "ENVIADO", "ENTREGUE", "CANCELADO"]).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
});
