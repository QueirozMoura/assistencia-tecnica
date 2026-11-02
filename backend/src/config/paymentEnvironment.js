// Checkout Pro uses init_point even with a test seller. Token prefixes alone
// cannot distinguish real and test sellers (both can use APP_USR).
export function isPaymentTestMode() {
  return process.env.NODE_ENV !== "production" || process.env.MERCADO_PAGO_MODE === "test";
}

export async function getPaymentCredentials() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw Object.assign(new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado."), { statusCode: 503 });
  }
  if (!isPaymentTestMode()) return { accessToken, testMode: false };

  const sellerId = process.env.MERCADO_PAGO_TEST_SELLER_ID;
  if (process.env.MERCADO_PAGO_MODE !== "test" || !/^\d+$/.test(sellerId || "")) {
    throw Object.assign(new Error("Pagamento local bloqueado: configure modo test e ID do vendedor de teste."), { statusCode: 503 });
  }
  // Read-only identity verification happens before any preference/payment call.
  // Fail closed on missing tags, wrong account, network failure or invalid token.
  let seller;
  try {
    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("IDENTITY_UNAVAILABLE");
    seller = await response.json();
  } catch {
    throw Object.assign(new Error("Não foi possível confirmar o vendedor de teste. Pagamento bloqueado."), { statusCode: 503 });
  }
  if (String(seller?.id) !== sellerId || !Array.isArray(seller?.tags) || !seller.tags.includes("test_user")) {
    throw Object.assign(new Error("Credencial recusada: a conta não corresponde ao vendedor de teste autorizado."), { statusCode: 503 });
  }
  return { accessToken, testMode: true, sellerId };
}

export function validateLocalPaymentUrls({ successUrl, failureUrl, pendingUrl, notificationUrl }) {
  if (!isPaymentTestMode()) return;
  const origin = new URL(process.env.FRONTEND_URL || "http://localhost:5173");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) {
    throw Object.assign(new Error("FRONTEND_URL de teste deve apontar para localhost."), { statusCode: 503 });
  }
  for (const value of [successUrl, failureUrl, pendingUrl]) {
    let url;
    try { url = new URL(value); } catch { /* rejected below */ }
    if (!url || url.origin !== origin.origin || url.username || url.password) {
      throw Object.assign(new Error("URLs de retorno de teste devem usar a origem local do frontend."), { statusCode: 503 });
    }
  }
  // Public exposure must be configured explicitly after user approval.
  if (notificationUrl && process.env.MERCADO_PAGO_ALLOW_PUBLIC_WEBHOOK !== "true") {
    throw Object.assign(new Error("Webhook público de desenvolvimento ainda não autorizado na configuração local."), { statusCode: 503 });
  }
}
