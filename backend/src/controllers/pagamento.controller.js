import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import * as pedidoService from "../services/pedido.service.js";
import {
  createMercadoPagoPreference,
  processMercadoPagoWebhook,
  validateMercadoPagoWebhookSignature,
} from "../services/pagamento.service.js";

export async function criarPreferencia(req, res, next) {
  try {
    const pedidoId = Number(req.params.pedidoId);
    if (!pedidoId || Number.isNaN(pedidoId)) {
      return res.status(400).json({ success: false, message: "ID de pedido inválido." });
    }

    const checkoutToken = req.body?.checkoutToken || req.query?.token;

    const { pedido } = await pedidoService.validarAcessoPagamentoPedido({
      pedidoId,
      clienteId: req.cliente?.id ?? null,
      checkoutToken: typeof checkoutToken === "string" ? checkoutToken : null,
    });

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

    const saved = await prisma.pedido.updateMany({
      where: { id: pedidoId, status: "PENDENTE", paymentStatus: pedido.paymentStatus, preferenceId: pedido.preferenceId },
      data: {
        preferenceId: pref.preferenceId,
        externalReference: pref.externalReference,
      },
    });

    if (saved.count !== 1) {
      throw Object.assign(new Error("Pedido alterado durante criação da preferência. Atualize os dados."), { statusCode: 409 });
    }
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
    const signatureHeader = req.webhookSignature || req.get("x-signature") || "";
    const requestId = req.webhookRequestId || req.get("x-request-id") || "";
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    const dataId = String(req.query?.["data.id"] ?? req.body?.data?.id ?? "");
    if (req.body?.data?.id != null && String(req.body.data.id).toLowerCase() !== dataId.toLowerCase()) {
      return res.status(401).json({ success: false, message: "ID do webhook divergente." });
    }

    logger.info("Webhook Mercado Pago recebido no endpoint de pagamentos", {
      provider: "mercadopago",
      hasSecret: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET),
      hasSignature: Boolean(signatureHeader),
      hasRequestId: Boolean(requestId),
    });

    const validation = validateMercadoPagoWebhookSignature({
      signatureHeader,
      requestId,
      secret,
      dataId,
    });

    if (!validation.valid) {
      logger.warn("Webhook Mercado Pago rejeitado por assinatura inválida", {
        provider: "mercadopago",
        reason: validation.reason,
      });

      return res.status(401).json({
        success: false,
        message: "Assinatura do webhook inválida.",
      });
    }

    logger.info("Assinatura do webhook Mercado Pago validada", {
      provider: "mercadopago",
    });

    const result = await processMercadoPagoWebhook(req.body, {
      rawPayload: req.rawBody,
      signatureHeader,
    });
    return res.status(200).json({
      success: true,
      message: "Webhook processado com sucesso.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
