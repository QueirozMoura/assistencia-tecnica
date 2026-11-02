import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

Object.assign(process.env, { NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture", DEV_DATABASE_HOST: "127.0.0.1",
  EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock", MERCADO_PAGO_MODE: "test", MERCADO_PAGO_TEST_SELLER_ID: "123", MERCADO_PAGO_ACCESS_TOKEN: "synthetic-only" });
const SECRET = "synthetic-webhook-secret-for-this-test-only";
const logger = (await import("../src/config/logger.js")).default;
const { webhookMercadoPago } = await import("../src/controllers/pagamento.controller.js");
const prisma = (await import("../src/config/prisma.js")).default;

let logs, restore = [];
const swap = (target, key, value) => { const previous = target[key]; target[key] = value; restore.push(() => { target[key] = previous; }); };
beforeEach(() => {
  logs = []; process.env.MERCADO_PAGO_WEBHOOK_SECRET = SECRET;
  swap(logger, "warn", message => { logs.push(String(message)); });
  swap(logger, "info", () => {});
  // Any database access would mean a rejected notification reached business logic.
  swap(prisma, "$transaction", () => { throw new Error("DATABASE_MUST_NOT_BE_TOUCHED"); });
  swap(prisma.pedido, "findUnique", () => { throw new Error("DATABASE_MUST_NOT_BE_TOUCHED"); });
});
afterEach(() => { while (restore.length) restore.pop()(); });

const request = ({ signature, requestId = "req-123", query = { "data.id": "98765" }, body = { type: "payment", data: { id: "98765" }, live_mode: false } } = {}) => ({
  method: "POST", originalUrl: `/api/pagamentos/webhook?data.id=${query["data.id"]}`, ip: "203.0.113.9", query, body, rawBody: Buffer.from(JSON.stringify(body)),
  headers: { "user-agent": "agent/1.0 " + "x".repeat(300) },
  webhookSignature: signature, webhookRequestId: requestId, get: () => "",
});
const call = async req => { const res = { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await webhookMercadoPago(req, res, error => { throw error; }); return res; };

for (const [name, signature, reason] of [
  ["missing signature", undefined, "INVALID_SIGNATURE_FORMAT"],
  ["malformed signature", "garbage", "INVALID_SIGNATURE_FORMAT"],
  ["well-formed but wrong HMAC", `ts=1700000000,v1=${"a".repeat(64)}`, "INVALID_SIGNATURE"],
]) {
  test(`webhook with ${name} is rejected (401) with a sanitized security log and no database access`, async () => {
    const res = await call(request({ signature }));
    assert.equal(res.statusCode, 401); assert.equal(res.body.success, false);
    assert.equal(logs.length, 1);
    const entry = JSON.parse(logs[0]);
    assert.equal(entry.event, "SECURITY_WEBHOOK_REJECTED"); assert.equal(entry.details.reason, reason); assert.equal(entry.details.provider, "mercadopago");
    assert.equal(entry.path, "/api/pagamentos/webhook", "no query string (data.id is attacker-controlled)");
    assert.ok(entry.userAgent.length <= 120);
    const text = logs[0];
    for (const forbidden of [SECRET, signature, "req-123", "98765", "live_mode", "data"].filter(Boolean)) {
      if (forbidden === "data") continue;
      assert.ok(!text.includes(forbidden), `log leaked ${forbidden}`);
    }
  });
}
test("webhook without a configured secret is rejected, never trusted", async () => {
  delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const res = await call(request({ signature: `ts=1700000000,v1=${"b".repeat(64)}` }));
  assert.equal(res.statusCode, 401); assert.equal(JSON.parse(logs[0]).details.reason, "WEBHOOK_SECRET_NOT_CONFIGURED");
});
test("webhook whose query data.id differs from the body is rejected and logged without either id", async () => {
  const res = await call(request({ signature: `ts=1700000000,v1=${"c".repeat(64)}`, query: { "data.id": "11111" }, body: { type: "payment", data: { id: "22222" }, live_mode: false } }));
  assert.equal(res.statusCode, 401);
  const entry = JSON.parse(logs[0]); assert.equal(entry.details.reason, "DATA_ID_MISMATCH");
  assert.ok(!logs[0].includes("11111") && !logs[0].includes("22222"));
});
