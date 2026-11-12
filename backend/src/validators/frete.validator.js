import { z } from "zod";
import { itemPedidoSchema, cepSchema, MAX_ITENS_PEDIDO } from "./pedido.validator.js";

export const freteCotacaoSchema = z.object({
  cep: cepSchema,
  itens: z
    .array(itemPedidoSchema, { required_error: "Itens do carrinho são obrigatórios." })
    .min(1, "O carrinho deve ter pelo menos um item.")
    .max(MAX_ITENS_PEDIDO, `O carrinho pode ter no máximo ${MAX_ITENS_PEDIDO} produtos diferentes.`),
});
