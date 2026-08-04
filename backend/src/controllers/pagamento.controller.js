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
    const signatureHeader =
      req.get("x-signature") ||
      req.get("x-signature-hmac-sha256") ||
      req.get("x-mercadopago-signature") ||
      "";
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    logger.info("Webhook Mercado Pago recebido no endpoint de pagamentos", {
      provider: "mercadopago",
      hasSignatureHeader: Boolean(signatureHeader),
      hasRawBody: Boolean(rawBody),
    });

    const validation = validateMercadoPagoWebhookSignature({
      rawBody,
      signatureHeader,
      secret,
    });

    if (validation.reason === "WEBHOOK_SECRET_NOT_CONFIGURED") {
      logger.warn("Webhook Mercado Pago sem validação de assinatura por compatibilidade", {
        provider: "mercadopago",
        reason: validation.reason,
      });
    } else if (!validation.valid) {
      logger.warn("Webhook Mercado Pago rejeitado por assinatura inválida", {
        provider: "mercadopago",
        reason: validation.reason,
      });

      return res.status(401).json({
        success: false,
        message: "Assinatura do webhook inválida.",
      });
    } else {
      logger.info("Assinatura do webhook Mercado Pago validada", {
        provider: "mercadopago",
      });
    }

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
