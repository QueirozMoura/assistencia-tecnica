import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

// Synthetic configuration only; override Prisma's dotenv defaults and never connect to Neon.
process.env.NODE_ENV = "development";
process.env.EMAIL_TRANSPORT = "mock";
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
process.env.DEV_DATABASE_HOST = "127.0.0.1";
const { getPaymentCredentials } = await import("../src/config/paymentEnvironment.js");
const { createMercadoPagoPreference, validateMercadoPagoWebhookSignature, processMercadoPagoWebhook } = await import("../src/services/pagamento.service.js");
const { webhookMercadoPago } = await import("../src/controllers/pagamento.controller.js");
const { buscarPedidoSucessoPorId } = await import("../src/controllers/pedido.controller.js");
const prisma = (await import("../src/config/prisma.js")).default;
const originalFetch = globalThis.fetch;
let calls;
const reply = data => ({ ok: true, status: 200, json: async () => data });
const syntheticPreference = () => createMercadoPagoPreference({
  pedido: { id: 123 }, itens: [{ produtoId: 1, nome: "Produto fictício", quantidade: 1, precoUnitario: 1 }],
  payer: { email: "buyer@testuser.com", nome: "Comprador fictício" },
});
beforeEach(() => {
  Object.assign(process.env, {
    NODE_ENV: "development", MERCADO_PAGO_MODE: "test", MERCADO_PAGO_TEST_SELLER_ID: "123",
    MERCADO_PAGO_ACCESS_TOKEN: "synthetic-credential", FRONTEND_URL: "http://localhost:5173",
    MERCADO_PAGO_SUCCESS_URL: "http://localhost:5173/pagamento/sucesso",
    MERCADO_PAGO_FAILURE_URL: "http://localhost:5173/checkout",
    MERCADO_PAGO_PENDING_URL: "http://localhost:5173/checkout/pendente",
    MERCADO_PAGO_NOTIFICATION_URL: "", MERCADO_PAGO_ALLOW_PUBLIC_WEBHOOK: "false",
    MERCADO_PAGO_WEBHOOK_SECRET: "synthetic-webhook-secret",
  });
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/users/me")) return reply({ id: 123, tags: ["test_user"] });
    throw new Error("Unexpected external request blocked by test");
  };
});
afterEach(() => { globalThis.fetch = originalFetch; });

test("development rejects live mode, absent credentials and unknown seller before preference creation", async () => {
  process.env.MERCADO_PAGO_MODE = "live";
  await assert.rejects(syntheticPreference, /modo test/);
  assert.equal(calls.length, 0);
  process.env.MERCADO_PAGO_MODE = "test";
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "";
  await assert.rejects(syntheticPreference, /não configurado/);
  assert.equal(calls.length, 0);
});

test("real seller, wrong seller and identity outage never reach preference POST", async () => {
  for (const account of [{ id: 123, tags: [] }, { id: 456, tags: ["test_user"] }, {}]) {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.mercadopago.com/users/me");
      assert.notEqual(options.method, "POST");
      return reply(account);
    };
    await assert.rejects(syntheticPreference, /Credencial recusada/);
  }
  globalThis.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(syntheticPreference, /Pagamento bloqueado/);
});

test("production credentials path retains existing behavior without a test identity lookup", async () => {
  process.env.NODE_ENV = "production";
  delete process.env.MERCADO_PAGO_MODE;
  assert.equal((await getPaymentCredentials()).testMode, false);
  assert.equal(calls.length, 0);
});

test("test preference serializes fictitious items and local return URLs using a verified test seller", async () => {
  const identity = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/users/me")) return identity(url, options);
    calls.push({ url, options });
    assert.equal(url, "https://api.mercadopago.com/checkout/preferences");
    assert.equal(options.method, "POST");
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.items, [{ id: "1", title: "Produto fictício", quantity: 1, unit_price: 1, currency_id: "BRL" }]);
    assert.equal(payload.external_reference, "pedido_123");
    assert.equal(payload.notification_url, undefined);
    for (const url of Object.values(payload.back_urls)) assert.equal(new URL(url).origin, "http://localhost:5173");
    return reply({ id: "synthetic-preference", init_point: "https://www.mercadopago.com.br/checkout/start?pref_id=synthetic" });
  };
  assert.match((await syntheticPreference()).initPoint, /^https:\/\/www.mercadopago/);
  assert.equal(calls.length, 2);
});

test("local checkout rejects missing/production return URLs and unapproved public webhook", async () => {
  for (const value of ["", "https://production.invalid/pagamento/sucesso"]) {
    process.env.MERCADO_PAGO_SUCCESS_URL = value;
    await assert.rejects(syntheticPreference, /origem local/);
  }
  process.env.MERCADO_PAGO_SUCCESS_URL = "http://localhost:5173/pagamento/sucesso";
  process.env.MERCADO_PAGO_NOTIFICATION_URL = "https://tunnel.invalid/api/pagamentos/webhook";
  await assert.rejects(syntheticPreference, /ainda não autorizado/);
  assert.ok(calls.every(call => call.url.endsWith("/users/me")));
});

function signed(dataId = "abc123") {
  const timestamp = String(Date.now());
  const requestId = "synthetic-request";
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const digest = createHmac("sha256", process.env.MERCADO_PAGO_WEBHOOK_SECRET).update(manifest).digest("hex");
  return { dataId, requestId, signatureHeader: `ts=${timestamp},v1=${digest}`, secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET };
}

test("webhook HMAC accepts official manifest and rejects tampering, Unicode, malformed hex and missing headers", () => {
  const fixture = signed("ABC123");
  assert.equal(validateMercadoPagoWebhookSignature(fixture).valid, true);
  for (const override of [{ dataId: "different" }, { requestId: "" }, { secret: "" }, { signatureHeader: "" },
    { signatureHeader: `ts=123,v1=${"é".repeat(64)}` }, { signatureHeader: `ts=NaN,v1=${"a".repeat(64)}` }]) {
    assert.equal(validateMercadoPagoWebhookSignature({ ...fixture, ...override }).valid, false);
  }
});

async function invokeWebhook({ body, query = {}, signature = "", requestId = "" }) {
  const result = {};
  const req = { body, query, get: name => ({ "x-signature": signature, "x-request-id": requestId })[name] };
  const res = { status(code) { result.status = code; return this; }, json(data) { result.data = data; return this; } };
  await webhookMercadoPago(req, res, error => { result.error = error; });
  return result;
}

test("all webhook aliases reject unsigned requests before network or database access", async () => {
  const result = await invokeWebhook({ body: { type: "payment", data: { id: 1 }, live_mode: false } });
  assert.equal(result.status, 401);
  assert.equal(calls.length, 0);
});

test("signed webhook rejects divergent query/body IDs and permits signed irrelevant test events", async () => {
  const fixture = signed();
  const divergent = await invokeWebhook({ body: { data: { id: "other" } }, query: { "data.id": "abc123" }, signature: fixture.signatureHeader, requestId: fixture.requestId });
  assert.equal(divergent.status, 401);
  const ignored = await invokeWebhook({ body: { type: "other", data: { id: "abc123" }, live_mode: false }, query: { "data.id": "abc123" }, signature: fixture.signatureHeader, requestId: fixture.requestId });
  assert.equal(ignored.status, 200);
  assert.equal(ignored.data.data.ignored, true);
  assert.equal(calls.length, 0);
});

test("live notifications and API payments cannot mutate local orders", async () => {
  await assert.rejects(() => processMercadoPagoWebhook({ type: "payment", data: { id: 1 }, live_mode: true }), /live_mode=false/);
  for (const payment of [{ live_mode: true, collector_id: 123 }, { live_mode: false, collector_id: 999 }, { collector_id: 123 }]) {
    const identity = async () => reply({ id: 123, tags: ["test_user"] });
    globalThis.fetch = async url => url.endsWith("/users/me") ? identity() : reply(payment);
    await assert.rejects(() => processMercadoPagoWebhook({ type: "payment", data: { id: 1 }, live_mode: false }), /ambiente ou vendedor/);
  }
});

test("signed test payment with wrong amount is ignored without updating an order", async () => {
  const originalFind = prisma.pedido.findUnique;
  const originalTransaction = prisma.$transaction;
  try {
    prisma.pedido.findUnique = async () => ({ id: 123, valorTotal: 10 });
    prisma.$transaction = () => { throw new Error("Unexpected database mutation"); };
    globalThis.fetch = async url => reply(url.endsWith("/users/me")
      ? { id: 123, tags: ["test_user"] }
      : { id: 1, collector_id: 123, live_mode: false, external_reference: "pedido_123", transaction_amount: 1 });
    const result = await processMercadoPagoWebhook({ type: "payment", data: { id: 1 }, live_mode: false });
    assert.equal(result.reason, "PAYMENT_AMOUNT_MISMATCH");
  } finally {
    prisma.pedido.findUnique = originalFind;
    prisma.$transaction = originalTransaction;
  }
});

test("return endpoint ignores forged approved status and reads the stored pending order", async () => {
  const originalFind = prisma.pedido.findFirst;
  const originalUpdate = prisma.pedido.update;
  try {
    prisma.pedido.findFirst = async ({ where }) => {
      assert.deepEqual(where, { id: 123, clienteId: 1 });
      return { id: 123, status: "PENDENTE", paymentStatus: "PENDING", itens: [] };
    };
    prisma.pedido.update = () => { throw new Error("Return endpoint must never update payment state"); };
    const result = {};
    const res = { status(code) { result.status = code; return this; }, json(data) { result.data = data; return this; } };
    await buscarPedidoSucessoPorId({ cliente: { id: 1 }, params: { pedidoId: "123" }, query: { status: "approved", collection_status: "approved" } }, res, error => { throw error; });
    assert.equal(result.status, 200);
    assert.equal(result.data.data.paymentStatus, "PENDING");
    assert.equal(calls.length, 0);
  } finally {
    prisma.pedido.findFirst = originalFind;
    prisma.pedido.update = originalUpdate;
  }
});
