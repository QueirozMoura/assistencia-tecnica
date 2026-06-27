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
      success: successUrl || "http://localhost:5173/pagamento/sucesso",
      failure: failureUrl || "http://localhost:5173/pagamento/falha",
      pending: pendingUrl || "http://localhost:5173/pagamento/pendente",
    },
    auto_return: "approved",
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

    const data = await response.json();

    if (!response.ok) {
      logger.error("Erro ao criar preferência Mercado Pago", {
        status: response.status,
        response: data,
      });

      throw Object.assign(new Error("Erro ao criar preferência no Mercado Pago."), {
        statusCode: 502,
      });
    }

    return {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      externalReference,
      raw: data,
    };
  } catch (error) {
    if (!error.statusCode) {
      logger.error("Falha de comunicação com Mercado Pago", { error: error.message });
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
