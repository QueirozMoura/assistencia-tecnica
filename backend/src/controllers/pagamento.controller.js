import prisma from "../config/prisma.js";
import { createMercadoPagoPreference, processMercadoPagoWebhook } from "../services/pagamento.service.js";

export async function criarPreferencia(req, res, next) {
  try {
    const pedidoId = Number(req.params.pedidoId);
    if (!pedidoId || Number.isNaN(pedidoId)) {
      return res.status(400).json({ success: false, message: "ID de pedido inválido." });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        itens: {
          include: {
            produto: { select: { id: true, nome: true } },
          },
        },
      },
    });

    if (!pedido) {
      return res.status(404).json({ success: false, message: "Pedido não encontrado." });
    }

    const itens = pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.produto?.nome || `Produto #${item.produtoId}`,
      quantidade: item.quantidade,
      precoUnitario: Number(item.precoUnitario),
    }));

    const pref = await createMercadoPagoPreference({
      pedido,
      itens,
      payer: pedido.cliente,
    });

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        preferenceId: pref.preferenceId,
        externalReference: pref.externalReference,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        pedidoId,
        preferenceId: pref.preferenceId,
        init_point: pref.initPoint,
        sandbox_init_point: pref.sandboxInitPoint,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function webhookMercadoPago(req, res, next) {
  try {
    const result = await processMercadoPagoWebhook(req.body);
    return res.status(200).json({
      success: true,
      message: "Webhook processado com sucesso.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
