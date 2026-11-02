import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

Object.assign(process.env, {
  NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
  DEV_DATABASE_HOST: "127.0.0.1", EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock",
  MERCADO_PAGO_MODE: "test", MERCADO_PAGO_TEST_SELLER_ID: "123", MERCADO_PAGO_ACCESS_TOKEN: "synthetic-only",
});
const prisma = (await import("../src/config/prisma.js")).default;
const { atualizarStatusPedido, validarAcessoPagamentoPedido } = await import("../src/services/pedido.service.js");
const { processMercadoPagoWebhook } = await import("../src/services/pagamento.service.js");
const { assertOrderTransition } = await import("../src/services/orderState.js");

let order, stock, increments, events, nextPayment, beforeCompare, queue, debitEvidence, returned, failReturn;
const originals = [];
const originalFetch = globalThis.fetch;
const copy = value => structuredClone(value);
function replace(target, key, value) {
  const previous = target[key]; target[key] = value;
  originals.push(() => { target[key] = previous; });
}
beforeEach(() => {
  order = { id: 1, clienteId: 1, status: "PENDENTE", paymentStatus: "PENDING", paidAt: null, valorTotal: 10, preferenceId: "fixture-preference", itens: [{ produtoId: 1, quantidade: 2 }], cliente: { id: 1, email: "fixture@example.invalid" } };
  debitEvidence = true; returned = false; failReturn = false;
  stock = 3; increments = 0; events = new Map(); beforeCompare = null; queue = Promise.resolve();
  nextPayment = { id: 1, collector_id: 123, live_mode: false, external_reference: "pedido_1", preference_id: "fixture-preference", status: "pending", transaction_amount: 10 };
  globalThis.fetch = async url => {
    if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 123, tags: ["test_user"] }) };
    if (url === "https://api.mercadopago.com/v1/payments/1") return { ok: true, status: 200, json: async () => copy(nextPayment) };
    throw new Error("Unexpected external request blocked");
  };
  const pedido = {
    findUnique: async () => copy(order),
    updateMany: async ({ where, data }) => {
      if (beforeCompare) { const callback = beforeCompare; beforeCompare = null; callback(); }
      assert.equal(typeof where.status, "string", "every mutation must compare the exact observed state");
      if (!order || Object.entries(where).some(([key, value]) => order[key] !== value)) return { count: 0 };
      Object.assign(order, data); return { count: 1 };
    },
    update: () => { throw new Error("Unconditional state mutation forbidden"); },
  };
  const tx = {
    pedido,
    $queryRaw: async (sql, id, source) => {
      assert.equal(id, 1);
      assert.ok(["ADMIN_CANCELAMENTO", "WEBHOOK_CANCELAMENTO"].includes(source));
      assert.equal(order.status, "CANCELADO");
      if (failReturn) throw new Error("JFQ_STOCK_PRODUCT_MISSING");
      if (!debitEvidence || returned) return [{ count: 0 }];
      returned = true; stock += 2; increments++; return [{ count: 1 }];
    },
    mercadoPagoWebhookEvent: {
      upsert: async ({ where, create, update }) => {
        const key = where.provider_notificationId.notificationId;
        const event = events.get(key) || { id: key, ...create };
        if (events.has(key)) Object.assign(event, update);
        events.set(key, event); return copy(event);
      },
      create: async ({ data }) => { const key = String(events.size + 1); const event = { id: key, ...data }; events.set(key, event); return copy(event); },
      update: async ({ where, data }) => { Object.assign(events.get(where.id), data); return copy(events.get(where.id)); },
    },
  };
  replace(prisma.pedido, "findUnique", pedido.findUnique);
  replace(prisma, "$transaction", callback => {
    const run = queue.then(async () => {
      const snapshot = { order: copy(order), stock, increments, returned, events: copy(events) };
      try { return await callback(tx); }
      catch (error) { ({ order, stock, increments, returned, events } = snapshot); throw error; }
    });
    queue = run.catch(() => {}); return run;
  });
});
afterEach(() => { while (originals.length) originals.pop()(); globalThis.fetch = originalFetch; });
const webhook = (id = "fixture-event") => processMercadoPagoWebhook({ id, type: "payment", data: { id: 1 }, live_mode: false });

test("first cancellation returns inventory once and repeated cancellation is idempotent", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(stock, 5); assert.equal(increments, 1); assert.equal(order.status, "CANCELADO");
});
test("cancel, reopen, cancel cannot return inventory twice", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  await assert.rejects(() => atualizarStatusPedido(1, "PENDENTE"), { statusCode: 409 });
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(stock, 5); assert.equal(increments, 1);
});
test("concurrent cancellation callers serialize to a single inventory return in the transaction harness", async () => {
  await Promise.all([atualizarStatusPedido(1, "CANCELADO"), atualizarStatusPedido(1, "CANCELADO")]);
  assert.equal(increments, 1); assert.equal(stock, 5);
});
for (const status of ["PENDENTE", "PAGO", "PREPARANDO", "ENVIADO", "ENTREGUE"]) {
  test(`cancelled order cannot transition to ${status}`, async () => {
    order.status = "CANCELADO";
    await assert.rejects(() => atualizarStatusPedido(1, status), { statusCode: 409 });
    assert.equal(increments, 0);
  });
}
test("delivered orders cannot be cancelled or reopened, including same-state retries", async () => {
  order.status = "ENTREGUE";
  await assert.rejects(() => atualizarStatusPedido(1, "CANCELADO"), { statusCode: 409 });
  await assert.rejects(() => atualizarStatusPedido(1, "PENDENTE"), { statusCode: 409 });
  await atualizarStatusPedido(1, "ENTREGUE");
  assert.equal(increments, 0);
});
test("normal fulfillment follows allowed transitions without changing inventory again", async () => {
  for (const state of ["PAGO", "PREPARANDO", "ENVIADO", "ENTREGUE"]) await atualizarStatusPedido(1, state);
  assert.equal(order.status, "ENTREGUE"); assert.equal(increments, 0);
});
test("a stale administrative transition cannot overwrite a cancellation", async () => {
  beforeCompare = () => { order.status = "CANCELADO"; };
  await assert.rejects(() => atualizarStatusPedido(1, "PAGO"), { statusCode: 409 });
  assert.equal(increments, 0);
});
test("a stale cancellation matching an already cancelled row does not return inventory", async () => {
  beforeCompare = () => { order.status = "CANCELADO"; };
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(increments, 0);
});
test("missing order returns 404 without inventory mutation", async () => {
  order = null;
  await assert.rejects(() => atualizarStatusPedido(1, "CANCELADO"), { statusCode: 404 });
  assert.equal(increments, 0);
});
test("invalid/skipped/backward states are rejected by the backend", () => {
  for (const [from, to] of [["PENDENTE", "ENTREGUE"], ["PREPARANDO", "PENDENTE"], ["INVALID", "PAGO"], ["PENDENTE", "INVALID"]]) {
    assert.throws(() => assertOrderTransition(from, to), { statusCode: 409 });
  }
});
for (const paymentStatus of ["pending", "approved", "rejected"]) {
  test(`cancelled order ignores a late ${paymentStatus} webhook without reopening it`, async () => {
    order.status = "CANCELADO"; nextPayment.status = paymentStatus;
    const result = await webhook();
    assert.equal(result.reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION");
    assert.equal(order.status, "CANCELADO"); assert.equal(increments, 0);
  });
}
test("cancel, webhook, cancel cannot return inventory twice", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  nextPayment.status = "approved";
  await webhook();
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(stock, 5); assert.equal(increments, 1);
});
test("a duplicated payment notification is processed once", async () => {
  await webhook();
  assert.equal((await webhook()).reason, "WEBHOOK_ALREADY_PROCESSED");
  assert.equal(events.size, 1); assert.equal(increments, 0);
});
test("different duplicate notifications do not repeat inventory changes", async () => {
  await Promise.all([webhook("event-1"), webhook("event-2")]);
  assert.equal(order.status, "PENDENTE"); assert.equal(increments, 0);
});
test("old pending/rejected payment cannot undo a confirmed order", async () => {
  order.status = "PAGO"; order.paymentStatus = "PAID";
  for (const status of ["pending", "rejected"]) {
    nextPayment.status = status;
    assert.equal((await webhook(status)).reason, "PAYMENT_STATE_REGRESSION");
  }
  assert.equal(order.status, "PAGO"); assert.equal(increments, 0);
});
test("approval never rewinds preparation, shipping or delivery", async () => {
  for (const status of ["PREPARANDO", "ENVIADO", "ENTREGUE"]) {
    order.status = status; order.paymentStatus = "PAID"; nextPayment.status = "approved";
    await webhook(status);
    assert.equal(order.status, status);
  }
  assert.equal(increments, 0);
});
test("webhook CAS conflict rejects the transaction without inventory effects", async () => {
  nextPayment.status = "approved";
  beforeCompare = () => { order.status = "CANCELADO"; };
  await assert.rejects(() => webhook(), { statusCode: 409 });
  assert.equal(increments, 0); assert.equal(events.size, 0);
});
test("cancelled/paid orders cannot create a new payment attempt", async () => {
  for (const state of ["CANCELADO", "PAGO", "PREPARANDO", "ENTREGUE"]) {
    order.status = state;
    await assert.rejects(() => validarAcessoPagamentoPedido({ pedidoId: 1, clienteId: 1 }), { statusCode: 409 });
  }
});

test("historical order without proof cancels without manufacturing a stock return", async () => {
  debitEvidence = false;
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(order.status, "CANCELADO"); assert.equal(stock, 3); assert.equal(increments, 0);
});
test("rejected payment releases proven reserve exactly once across repeated and late events", async () => {
  nextPayment.status = "rejected";
  await webhook("rejected-1"); await webhook("rejected-2");
  nextPayment.status = "approved"; await webhook("late-approved");
  assert.equal(order.status, "CANCELADO"); assert.equal(order.paymentStatus, "FAILED");
  assert.equal(stock, 5); assert.equal(increments, 1);
});
test("historical rejected payment without debit evidence never increments stock", async () => {
  debitEvidence = false; nextPayment.status = "rejected";
  await webhook(); assert.equal(stock, 3); assert.equal(increments, 0);
});
test("return failure rolls back administrative state and inventory", async () => {
  failReturn = true;
  await assert.rejects(() => atualizarStatusPedido(1, "CANCELADO"), { statusCode: 409 });
  assert.equal(order.status, "PENDENTE"); assert.equal(stock, 3); assert.equal(increments, 0);
});
test("return failure rolls back webhook state, dedupe marker and inventory", async () => {
  failReturn = true; nextPayment.status = "rejected";
  await assert.rejects(() => webhook(), { statusCode: 409 });
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "PENDING");
  assert.equal(stock, 3); assert.equal(events.size, 0);
});
