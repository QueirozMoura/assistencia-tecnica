import crypto from "crypto";
import logger from "../config/logger.js";
import prisma from "../config/prisma.js";
import { notifyAdminPaymentApproved } from "./notification.service.js";

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

  const signatureParts = String(signatureHeader || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const v1Part = signatureParts.find((part) => part.toLowerCase().startsWith("v1="));
  if (!v1Part) {
    return { valid: false, reason: "INVALID_SIGNATURE_FORMAT" };
  }

  const received = v1Part.slice(3).trim();
  if (!received) {
    return { valid: false, reason: "INVALID_SIGNATURE_FORMAT" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

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
      quantity: Number(item.quantidade),
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
      success:
        successUrl ||
        `https://assistencia-tecnica-mauve.vercel.app/pagamento/sucesso?pedidoId=${pedido.id}`,
      failure: failureUrl || "https://example.com/pagamento/falha",
      pending: pendingUrl || "https://example.com/pagamento/pendente",
    },
    notification_url: notificationUrl || undefined,
  };

  const ensureValidHttpUrl = (value, fieldName) => {
    if (!value) return;
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("INVALID_PROTOCOL");
      }
    } catch {
      throw Object.assign(new Error(`${fieldName} inválida para Mercado Pago.`), {
        statusCode: 400,
      });
    }
  };

  ensureValidHttpUrl(body.back_urls?.success, "MERCADO_PAGO_SUCCESS_URL/back_urls.success");
  ensureValidHttpUrl(body.back_urls?.failure, "MERCADO_PAGO_FAILURE_URL/back_urls.failure");
  ensureValidHttpUrl(body.back_urls?.pending, "MERCADO_PAGO_PENDING_URL/back_urls.pending");
  ensureValidHttpUrl(body.notification_url, "MERCADO_PAGO_NOTIFICATION_URL/notification_url");

  for (const item of body.items) {
    if (!item.title || typeof item.title !== "string") {
      throw Object.assign(new Error("Item inválido para Mercado Pago: title ausente."), {
        statusCode: 400,
      });
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw Object.assign(
        new Error(`Item inválido para Mercado Pago: quantity inválida (${item.id}).`),
        { statusCode: 400 },
      );
    }

    if (!Number.isFinite(item.unit_price) || item.unit_price <= 0) {
      throw Object.assign(
        new Error(`Item inválido para Mercado Pago: unit_price inválido (${item.id}).`),
        { statusCode: 400 },
      );
    }
  }

  if (body.payer?.email && !String(body.payer.email).includes("@")) {
    throw Object.assign(new Error("payer.email inválido para Mercado Pago."), {
      statusCode: 400,
    });
  }

  const requestId = `mp_pref_${pedido.id}_${Date.now()}`;
  const tokenPrefix = String(accessToken).slice(0, 8);
  const sanitizedPayload = {
    ...body,
    payer: body.payer
      ? {
          email: body.payer.email ? "***@***" : undefined,
          name: body.payer.name || undefined,
        }
      : undefined,
  };

  logger.info("Mercado Pago preference request payload", {
    requestId,
    pedidoId: pedido.id,
    externalReference,
    tokenPrefix,
    payload: sanitizedPayload,
  });

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

    logger.info("Mercado Pago preference response", {
      requestId,
      pedidoId: pedido.id,
      status: response.status,
      statusText: response.statusText,
      preferenceId: data?.id ?? null,
      hasInitPoint: Boolean(data?.init_point),
      hasSandboxInitPoint: Boolean(data?.sandbox_init_point),
    });

    if (!response.ok) {
      const details = {
        requestId,
        status: response.status,
        statusText: response.statusText,
        message: data?.message ?? null,
        error: data?.error ?? null,
        cause: data?.cause ?? null,
        responseData: data,
      };

      logger.error("Erro ao criar preferência Mercado Pago", details);

      const err = new Error("Erro ao criar preferência no Mercado Pago.");
      err.statusCode = 502;
      err.mpStatus = response.status;
      err.mpStatusText = response.statusText;
      err.mpResponse = data;
      err.mpCause = data?.cause ?? null;
      err.mpRequestId = requestId;
      throw err;
    }

    return {
      preferenceId: data?.id,
      initPoint: data?.init_point,
      sandboxInitPoint: data?.sandbox_init_point,
      externalReference,
      raw: data,
    };
  } catch (error) {
    const errorDetails = {
      message: error?.message,
      statusCode: error?.statusCode,
      mpStatus: error?.mpStatus,
      mpStatusText: error?.mpStatusText,
      mpRequestId: error?.mpRequestId,
      mpCause: error?.mpCause,
      mpResponse: error?.mpResponse,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    };

    logger.error("Falha detalhada Mercado Pago (create preference)", errorDetails);

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
    // Debug logging do Mercado Pago é feito via logger.debug() em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      logger.debug("Resposta Mercado Pago:", { paymentId, status: response.status, dataReceived: !!data });
    }
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

  const expectedAmount = Number(pedidoAtual?.valorTotal);
  const receivedAmount = Number(payment?.transaction_amount);
  const invalidAmount =
    !Number.isFinite(expectedAmount) || !Number.isFinite(receivedAmount);

  if (invalidAmount || Math.abs(receivedAmount - expectedAmount) > 0.01) {
    logger.warn("Webhook ignorado por divergência de valor do pagamento", {
      pedidoId,
      paymentId: payment?.id,
      expectedAmount,
      receivedAmount,
    });
    return {
      ...normalized,
      ignored: true,
      reason: "PAYMENT_AMOUNT_MISMATCH",
    };
  }

  if (!payment?.preference_id || payment.preference_id !== pedidoAtual?.preferenceId) {
    logger.warn("Webhook ignorado por divergência de preferência do pagamento", {
      pedidoId,
      paymentId: payment?.id,
      expectedPreferenceId: pedidoAtual?.preferenceId ?? null,
      receivedPreferenceId: payment?.preference_id ?? null,
    });
    return {
      ...normalized,
      ignored: true,
      reason: "PAYMENT_PREFERENCE_MISMATCH",
    };
  }

  const paymentId = payment?.id ? String(payment.id) : null;

  const mapped = mapMercadoPagoStatusToInternal(payment?.status);

  let pedidoAtualizado;

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      if (paymentId) {
        await tx.mercadoPagoWebhookEvent.create({
          data: {
            paymentId,
            action: normalized.action || null,
          },
        });
      }

      const updatedPedido = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          paymentId: paymentId || pedidoAtual.paymentId,
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
          valorTotal: true,
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      return { updatedPedido };
    });

    pedidoAtualizado = txResult.updatedPedido;
  } catch (error) {
    if (error?.code === "P2002" && String(error?.meta?.target || "").includes("paymentId")) {
      return {
        ...normalized,
        ignored: true,
        reason: "WEBHOOK_ALREADY_PROCESSED",
      };
    }
    throw error;
  }

  logger.info("Pedido atualizado por webhook Mercado Pago", {
    pedidoId,
    paymentId: payment?.id,
    oldStatus: pedidoAtual.status,
    newStatus: pedidoAtualizado.status,
    oldPaymentStatus: pedidoAtual.paymentStatus,
    newPaymentStatus: pedidoAtualizado.paymentStatus,
  });

  const becamePaid =
    pedidoAtual.paymentStatus !== "PAID" &&
    pedidoAtualizado.paymentStatus === "PAID" &&
    pedidoAtualizado.status === "PAGO";

  if (becamePaid) {
    try {
      await notifyAdminPaymentApproved({
        pedido: pedidoAtualizado,
        payment,
      });
    } catch (error) {
      logger.error("Falha ao executar notificação de pagamento aprovado.", {
        pedidoId,
        message: error?.message || "UNKNOWN_ERROR",
      });
      // Não interrompe resposta do webhook
    }
  }

  return {
    ...normalized,
    paymentId: payment?.id ?? null,
    paymentStatus: payment?.status ?? null,
    externalReference,
    pedidoId,
    updated: true,
  };
}
