import { z } from "zod";
import { itemPedidoSchema } from "./pedido.validator.js";

export const freteCotacaoSchema = z.object({
  cep: z
    .string({ required_error: "CEP é obrigatório." })
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Use o formato 00000-000."),
  itens: z
    .array(itemPedidoSchema, { required_error: "Itens do carrinho são obrigatórios." })
    .min(1, "O carrinho deve ter pelo menos um item.")
    .max(50, "Carrinho com itens demais."),
});
