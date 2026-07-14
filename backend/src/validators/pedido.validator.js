import { z } from "zod";

const itemPedidoSchema = z.object({
  produtoId: z
    .number({ required_error: "ID do produto é obrigatório." })
    .int()
    .positive("ID do produto inválido."),
  quantidade: z
    .number({ required_error: "Quantidade é obrigatória." })
    .int()
    .positive("Quantidade deve ser maior que zero."),
});

export const pedidoSchema = z.object({
  clienteId: z
    .number({ required_error: "Cliente é obrigatório." })
    .int()
    .positive("ID do cliente inválido."),
  itens: z
    .array(itemPedidoSchema, { required_error: "Itens do pedido são obrigatórios." })
    .min(1, "O pedido deve ter pelo menos um item."),
  observacoes: z.string().trim().optional().nullable(),

  nomeDestinatario: z.string().trim().min(1, "Nome do destinatário é obrigatório."),
  telefoneEntrega: z.string().trim().min(1, "Telefone de entrega é obrigatório."),
  cep: z.string().trim().min(1, "CEP é obrigatório."),
  rua: z.string().trim().min(1, "Rua é obrigatória."),
  numero: z.string().trim().min(1, "Número é obrigatório."),
  complemento: z.string().trim().optional().nullable(),
  bairro: z.string().trim().min(1, "Bairro é obrigatório."),
  cidade: z.string().trim().min(1, "Cidade é obrigatória."),
  estado: z.string().trim().min(1, "Estado é obrigatório."),
});

export const pedidoStatusSchema = z.object({
  status: z.enum(
    ["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"],
    { required_error: "Status é obrigatório." }
  ),
});

export const pedidoQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(["PENDENTE", "PAGO", "ENVIADO", "ENTREGUE", "CANCELADO"]).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
});
