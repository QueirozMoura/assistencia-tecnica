import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import * as pedidoService from "../services/pedido.service.js";
import { buildSuspiciousAttemptLog } from "../utils/logSanitizer.js";
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

    // O frete persistido no pedido entra como linha própria na preferência, para que a soma enviada ao
    // Mercado Pago seja igual a pedido.valorTotal (conferido em createMercadoPagoPreference e no webhook).
    // Pedidos anteriores à migração do frete têm valorFrete = 0 (default da coluna) e não geram linha de frete.
    const valorFrete = Number(pedido.valorFrete ?? 0);

    const pref = await createMercadoPagoPreference({
      pedido,
      itens,
      valorFrete,
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

// Security log for a rejected webhook: reason and presence flags only. Never the signature, the secret, the body
// or the query string (its data.id is attacker-controlled). A rejected notification creates NO financial pending item.
function logRejectedWebhook(req, reason, signatureHeader, requestId) {
  const entry = buildSuspiciousAttemptLog({
    event: "SECURITY_WEBHOOK_REJECTED",
    req,
    details: { provider: "mercadopago", reason, hasSignature: Boolean(signatureHeader), hasRequestId: Boolean(requestId) },
  });
  entry.path = String(req.originalUrl || req.url || "").split("?")[0];
  entry.userAgent = entry.userAgent ? String(entry.userAgent).slice(0, 120) : null;
  logger.warn(JSON.stringify(entry));
}

export async function webhookMercadoPago(req, res, next) {
  try {
    const signatureHeader = req.webhookSignature || req.get("x-signature") || "";
    const requestId = req.webhookRequestId || req.get("x-request-id") || "";
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    const dataId = String(req.query?.["data.id"] ?? req.body?.data?.id ?? "");
    if (req.body?.data?.id != null && String(req.body.data.id).toLowerCase() !== dataId.toLowerCase()) {
      logRejectedWebhook(req, "DATA_ID_MISMATCH", signatureHeader, requestId);
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
      logRejectedWebhook(req, validation.reason, signatureHeader, requestId);

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
