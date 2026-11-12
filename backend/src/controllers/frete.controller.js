import { cotarFrete } from "../services/resumoPedido.service.js";

// POST /api/frete/cotacao — calcula subtotal e frete no servidor com os preços atuais do banco.
export async function cotacao(req, res, next) {
  try {
    const { cep, itens } = req.body;
    const data = await cotarFrete({ cep, itens });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
