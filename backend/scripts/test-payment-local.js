import "dotenv/config";
import assert from "node:assert/strict";
import { getPaymentCredentials } from "../src/config/paymentEnvironment.js";
import { createMercadoPagoPreference } from "../src/services/pagamento.service.js";
import prisma from "../src/config/prisma.js";

// Real provider probe: creates a preference, never a payment or a paid order.
// pedido_0 deliberately cannot be mapped to an existing order by the webhook.
try {
  assert.equal(process.env.NODE_ENV, "development");
  assert.equal(new URL(process.env.DATABASE_URL).hostname, "ep-summer-bar-b8esi79j.c-14.us-east-1.aws.neon.tech");
  assert.equal(process.env.EMAIL_TRANSPORT, "mock");
  assert.equal(process.env.TELEGRAM_TRANSPORT, "mock");
  const credentials = await getPaymentCredentials();
  assert.equal(credentials.testMode, true);
  const preference = await createMercadoPagoPreference({
    pedido: { id: 0 },
    itens: [{ produtoId: 0, nome: "JFQ produto fictício de desenvolvimento", quantidade: 1, precoUnitario: 1 }],
  });
  assert.ok(preference.preferenceId);
  assert.equal(new URL(preference.initPoint).protocol, "https:");
  const response = await fetch(`https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(preference.preferenceId)}`, {
    headers: { Authorization: `Bearer ${credentials.accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(String(saved.collector_id), credentials.sellerId);
  assert.equal(saved.external_reference, "pedido_0");
  assert.equal(saved.items.length, 1);
  assert.equal(Number(saved.items[0].unit_price), 1);
  console.log("PASS preferência real de teste criada e consultada; vendedor de teste confirmado.");
  console.log("Nenhum pagamento efetuado, pedido gravado ou status alterado. Checkout e webhook ponta a ponta ainda exigem validação separada.");
} catch (error) {
  // Never print provider response bodies, URLs containing tokens, or credentials.
  console.error("FAIL teste real Mercado Pago:", error.code === "ERR_ASSERTION" ? "configuração ou resposta incompatível" : error.name);
  console.error("Confira modo test, credencial exclusiva, ID do vendedor de teste e acesso de rede. Nenhuma cobrança foi solicitada.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
