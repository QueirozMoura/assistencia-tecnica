import crypto from "crypto";
import logger from "../config/logger.js";

/**
 * Valida assinatura do webhook do Mercado Pago de forma opcional.
 * Se MERCADO_PAGO_WEBHOOK_SECRET não estiver configurado, não bloqueia requisição
 * para preservar compatibilidade do ambiente atual.
 */
export function validateMercadoPagoWebhookSignature({ rawBody, signatureHeader, secret }) {
  if (!secret) {
    return { valid: true, reason: "WEBHOOK_SECRET_NOT_CONFIGURED" };
  }

  if (!signatureHeader) {
    return { valid: false, reason: "MISSING_SIGNATURE_HEADER" };
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
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
export async function createMercadoPagoPreference({ pedido, itens = [], payer }) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const notificationUrl = process.env.MERCADO_PAGO_NOTIFICATION_URL;
  const successUrl = process.env.MERCADO_PAGO_SUCCESS_URL;
  const failureUrl = process.env.MERCADO_PAGO_FAILURE_URL;
  const pendingUrl = process.env.MERCADO_PAGO_PENDING_URL;

  if (!accessToken) {
    throw Object.assign(new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado."), { statusCode: 500 });
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
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

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
        `Erro ao criar preferência Mercado Pago: ${JSON.stringify(details)}`
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
      responseStatusText: error?.response?.statusText ?? error?.mpStatusText ?? null,
      responseData: error?.response?.data ?? error?.mpResponse ?? null,
      cause: error?.cause ?? error?.mpCause ?? null,
      stack: error?.stack ?? null,
    };

    logger.error(
      `Falha detalhada Mercado Pago (create preference): ${JSON.stringify(errorDetails)}`
    );

    if (!error.statusCode) {
      throw Object.assign(new Error("Erro de comunicação com o Mercado Pago."), { statusCode: 502 });
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

  return normalized;
}
