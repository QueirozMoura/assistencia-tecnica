import crypto from "crypto";
import logger from "../config/logger.js";
import prisma from "../config/prisma.js";

/**
 * Valida assinatura do webhook do Mercado Pago de forma opcional.
 * Se MERCADO_PAGO_WEBHOOK_SECRET não estiver configurado, não bloqueia requisição
 * para preservar compatibilidade do ambiente atual.
 */
export function validateMercadoPagoWebhookSignature({
  rawBody,
  signatureHeader,
  secret,
}) {
  if (!secret) {
    return { valid: true, reason: "WEBHOOK_SECRET_NOT_CONFIGURED" };
  }

  if (!signatureHeader) {
    return { valid: false, reason: "MISSING_SIGNATURE_HEADER" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const received = signatureHeader.trim();

  const valid =
    expected.length === received.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));

  return { valid, reason: valid ? "OK" : "INVALID_SIGNATURE" };
}

/**
 * Cria preferência de pagamento no Mercado Pago.
 * Integração aditiva para Etapa 2 sem alterar o fluxo legado de pedidos.
 */
export async function createMercadoPagoPreference({
  pedido,
  itens = [],
  payer,
}) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const notificationUrl = process.env.MERCADO_PAGO_NOTIFICATION_URL;
  const successUrl = process.env.MERCADO_PAGO_SUCCESS_URL;
  const failureUrl = process.env.MERCADO_PAGO_FAILURE_URL;
  const pendingUrl = process.env.MERCADO_PAGO_PENDING_URL;

  if (!accessToken) {
    throw Object.assign(
      new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado."),
      { statusCode: 500 },
    );
  }

  const externalReference = `pedido_${pedido.id}`;

  const body = {
    external_reference: externalReference,
    items: itens.map((item) => ({
      id: String(item.produtoId),
      title: item.nome,
      quantity: item.quantidade,
      unit_price: Number(item.precoUnitario),
      currency_id: "BRL",
    })),
    payer: payer?.email
      ? {
          email: payer.email,
          name: payer.nome ?? undefined,
        }
      : undefined,
    back_urls: {
      success: successUrl || "https://example.com/pagamento/sucesso",
      failure: failureUrl || "https://example.com/pagamento/falha",
      pending: pendingUrl || "https://example.com/pagamento/pendente",
    },
    notification_url: notificationUrl || undefined,
  };

  try {
    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const details = {
        status: response.status,
        statusText: response.statusText,
        message: data?.message ?? null,
        error: data?.error ?? null,
        cause: data?.cause ?? null,
        responseData: data,
      };

      logger.error(
        `Erro ao criar preferência Mercado Pago: ${JSON.stringify(details)}`,
      );

      const err = new Error("Erro ao criar preferência no Mercado Pago.");
      err.statusCode = 502;
      err.mpStatus = response.status;
      err.mpStatusText = response.statusText;
      err.mpResponse = data;
      err.mpCause = data?.cause ?? null;
      throw err;
    }

    return {
      preferenceId: data?.id,
      initPoint: data?.init_point,
      sandboxInitPoint: data?.sandbox_init_point,
      externalReference,
      raw: data,
      requestPayload: body,
    };
  } catch (error) {
    const errorDetails = {
      message: error?.message ?? null,
      name: error?.name ?? null,
      code: error?.code ?? null,
      status: error?.status ?? error?.statusCode ?? null,
      responseStatus: error?.response?.status ?? error?.mpStatus ?? null,
      responseStatusText:
        error?.response?.statusText ?? error?.mpStatusText ?? null,
      responseData: error?.response?.data ?? error?.mpResponse ?? null,
      cause: error?.cause ?? error?.mpCause ?? null,
      stack: error?.stack ?? null,
    };

    logger.error(
      `Falha detalhada Mercado Pago (create preference): ${JSON.stringify(errorDetails)}`,
    );

    if (!error.statusCode) {
      throw Object.assign(
        new Error("Erro de comunicação com o Mercado Pago."),
        { statusCode: 502 },
      );
    }

    throw error;
  }
}

/**
 * Normaliza payload mínimo de notificação do Mercado Pago para uso interno.
 * Não altera pedido nem fluxo existente nesta etapa.
 */
export function normalizeMercadoPagoNotification(payload = {}) {
  return {
    id: payload?.id ?? null,
    type: payload?.type ?? null,
    action: payload?.action ?? null,
    dataId: payload?.data?.id ?? null,
    liveMode: payload?.live_mode ?? null,
    raw: payload,
  };
}

/**
 * Processamento inicial (infraestrutura): apenas log estruturado.
 * Sem efeitos colaterais em pedidos para não alterar comportamento atual.
 */
function mapMercadoPagoStatusToInternal(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return { pedidoStatus: "PAGO", paymentStatus: "PAID" };
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "cancelled_by_user"
  ) {
    return { pedidoStatus: "CANCELADO", paymentStatus: "FAILED" };
  }

  return { pedidoStatus: "PENDENTE", paymentStatus: "PENDING" };
}

function extractPedidoIdFromExternalReference(externalReference) {
  if (!externalReference) return null;
  const match = String(externalReference).match(/pedido_(\d+)/i);
  if (!match) return null;
  return Number(match[1]);
}

async function getMercadoPagoPaymentById(paymentId) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw Object.assign(
      new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado."),
      { statusCode: 500 },
    );
  }

  
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  let data = null;
  try {
    data = await response.json();
    console.log("========== RESPONSE MERCADO PAGO ==========");
    console.log(JSON.stringify(data, null, 2));
    console.log("===========================================");
  } catch {
    data = null;
  }

  if (!response.ok) {
    logger.error("Erro ao consultar pagamento no Mercado Pago", {
      paymentId,
      status: response.status,
      statusText: response.statusText,
      responseData: data,
    });

    const err = new Error("Falha ao consultar pagamento no Mercado Pago.");
    err.statusCode = 502;
    throw err;
  }

  return data;
}

export async function processMercadoPagoWebhook(payload) {
  const normalized = normalizeMercadoPagoNotification(payload);

  logger.info("Webhook Mercado Pago recebido", {
    provider: "mercadopago",
    notificationId: normalized.id,
    notificationType: normalized.type,
    action: normalized.action,
    dataId: normalized.dataId,
    liveMode: normalized.liveMode,
  });

  const paymentEvent =
    normalized.type === "payment" ||
    normalized.action?.toLowerCase().includes("payment");

  if (!paymentEvent || !normalized.dataId) {
    logger.info("Webhook ignorado por não ser evento de pagamento válido", {
      notificationType: normalized.type,
      action: normalized.action,
      dataId: normalized.dataId,
    });
    return {
      ...normalized,
      ignored: true,
      reason: "NOT_PAYMENT_EVENT_OR_MISSING_DATA_ID",
    };
  }

  const payment = await getMercadoPagoPaymentById(normalized.dataId);
  const externalReference = payment?.external_reference || null;
  const pedidoId = extractPedidoIdFromExternalReference(externalReference);

  if (!pedidoId) {
    logger.warn("Webhook sem external_reference mapeável para pedido", {
      paymentId: payment?.id,
      externalReference,
    });
    return {
      ...normalized,
      ignored: true,
      reason: "EXTERNAL_REFERENCE_NOT_MAPPABLE",
      payment,
    };
  }

  const pedidoAtual = await prisma.pedido.findUnique({
    where: { id: pedidoId },
  });

  if (!pedidoAtual) {
    logger.warn("Pedido não encontrado para external_reference do webhook", {
      pedidoId,
      paymentId: payment?.id,
      externalReference,
    });
    return {
      ...normalized,
      ignored: true,
      reason: "PEDIDO_NOT_FOUND",
      payment,
    };
  }

  const mapped = mapMercadoPagoStatusToInternal(payment?.status);

  const pedidoAtualizado = await prisma.pedido.update({
    where: { id: pedidoId },
    data: {
      paymentId: payment?.id ? String(payment.id) : pedidoAtual.paymentId,
      paymentMethod: payment?.payment_method_id || pedidoAtual.paymentMethod,
      paymentStatus: mapped.paymentStatus,
      status: mapped.pedidoStatus,
      paidAt: mapped.paymentStatus === "PAID" ? new Date() : pedidoAtual.paidAt,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentId: true,
      paymentMethod: true,
      paidAt: true,
    },
  });

  logger.info("Pedido atualizado por webhook Mercado Pago", {
    pedidoId,
    paymentId: payment?.id,
    oldStatus: pedidoAtual.status,
    newStatus: pedidoAtualizado.status,
    oldPaymentStatus: pedidoAtual.paymentStatus,
    newPaymentStatus: pedidoAtualizado.paymentStatus,
  });

  return {
    ...normalized,
    paymentId: payment?.id ?? null,
    paymentStatus: payment?.status ?? null,
    externalReference,
    pedidoId,
    updated: true,
  };
}
