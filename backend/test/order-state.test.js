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

let pendencias, history, order, stock, increments, events, nextPayment, beforeCompare, queue, debitEvidence, returned, failReturn;
const originals = [];
const originalFetch = globalThis.fetch;
const copy = value => structuredClone(value);
function replace(target, key, value) {
  const previous = target[key]; target[key] = value;
  originals.push(() => { target[key] = previous; });
}
beforeEach(() => {
  order = { id: 1, clienteId: 1, status: "PENDENTE", paymentStatus: "PENDING", paidAt: null, valorTotal: 10, preferenceId: "fixture-preference", itens: [{ produtoId: 1, quantidade: 2 }], cliente: { id: 1, email: "fixture@example.invalid" } };
  debitEvidence = true; returned = false; failReturn = false; pendencias = new Map(); history = [];
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
    pagamentoConciliacaoHistorico: { create: async ({ data }) => { history.push(copy(data)); return data; } },
    $queryRaw: async (sql, ...params) => {
      if (String(sql[0]).includes("pagamento_conciliacoes")) { // INSERT ... ON CONFLICT DO UPDATE (atomic upsert by provider, key, tipo)
        const [provider, chave, tipo, verificacao, pedidoId, paymentId, paymentIdInformado, notificationId, rawPayloadHash, referenciaExterna, statusProvedor, statusPedido, valorProvedor, valorPedido, preferenciaProvedor, preferenciaPedido] = params;
        const key = `${provider}|${chave}|${tipo}`; const existing = pendencias.get(key);
        if (existing) { existing.ocorrencias++; return [{ id: existing.id, status: existing.status, inserted: false }]; }
        const row = { id: pendencias.size + 1, status: "PENDENTE", ocorrencias: 1, chave, tipo, verificacao, pedidoId, paymentId, paymentIdInformado, notificationId, rawPayloadHash, referenciaExterna, statusProvedor, statusPedido, valorProvedor, valorPedido, preferenciaProvedor, preferenciaPedido };
        pendencias.set(key, row); return [{ id: row.id, status: row.status, inserted: true }];
      }
      const [id, source] = params;
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
      const snapshot = { order: copy(order), stock, increments, returned, events: copy(events), pendencias: copy(pendencias), history: copy(history) };
      try { return await callback(tx); }
      catch (error) { ({ order, stock, increments, returned, events, pendencias, history } = snapshot); throw error; }
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

// --- Approved business rule: payment-vs-cancellation race (two valid outcomes only) ---
test("race outcome 1: confirmation first leaves the order PAGO; later administrative cancellation is refused", async () => {
  nextPayment.status = "approved";
  assert.equal((await webhook()).updated, true);
  await assert.rejects(() => atualizarStatusPedido(1, "CANCELADO"), { statusCode: 409 });
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.ok(order.paidAt);
  assert.equal(increments, 0); assert.equal(stock, 3);
});
test("race outcome 2: cancellation first releases stock once; later approval is held, not applied, and never re-reserves", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  nextPayment.status = "approved";
  const late = await webhook();
  assert.equal(late.reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION"); assert.equal(late.ignored, true);
  assert.equal(order.status, "CANCELADO"); assert.equal(order.paidAt, null); assert.notEqual(order.paymentStatus, "PAID");
  assert.equal(increments, 1); assert.equal(stock, 5, "stock released exactly once and not reserved again");
  await atualizarStatusPedido(1, "CANCELADO"); // idempotent retry
  assert.equal(increments, 1); assert.equal(stock, 5);
});
test("race interleaving A: payment confirmed between the cancellation read and write cannot be cancelled", async () => {
  beforeCompare = () => { order.status = "PAGO"; order.paymentStatus = "PAID"; order.paidAt = new Date().toISOString(); };
  await assert.rejects(() => atualizarStatusPedido(1, "CANCELADO"), { statusCode: 409, message: /pagamento confirmado/ });
  assert.equal(increments, 0); assert.equal(stock, 3); // final row state is asserted in the real-database REST suite (this harness rolls back the simulated concurrent commit)
});
test("race interleaving B: cancellation committed between the webhook read and write rejects the webhook transaction", async () => {
  nextPayment.status = "approved";
  beforeCompare = () => { order.status = "CANCELADO"; };
  await assert.rejects(() => webhook(), { statusCode: 409 });
  assert.equal(events.size, 0); assert.equal(increments, 0);
});
for (const adminFirst of [true, false]) {
  test(`simultaneous approval and cancellation (${adminFirst ? "cancellation" : "approval"} serialized first) never ends CANCELADO with a confirmed payment`, async () => {
    nextPayment.status = "approved";
    const launch = [() => webhook().catch(error => ({ error })), () => atualizarStatusPedido(1, "CANCELADO").catch(error => ({ error }))];
    if (adminFirst) launch.reverse();
    await Promise.all(launch.map(fn => fn()));
    if (order.status === "CANCELADO") { assert.notEqual(order.paymentStatus, "PAID"); assert.equal(order.paidAt, null); assert.equal(increments, 1); assert.equal(stock, 5); }
    else { assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.equal(increments, 0); assert.equal(stock, 3); }
  });
}
test("only provider-confirmed payment blocks cancellation: a manually marked PAGO without confirmation remains cancellable", async () => {
  await atualizarStatusPedido(1, "PAGO"); order.paymentStatus = null; order.paidAt = null;
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(order.status, "CANCELADO"); assert.equal(increments, 1);
});
test("confirmed payment also blocks cancellation from preparation and shipping", async () => {
  for (const status of ["PREPARANDO", "ENVIADO"]) {
    order.status = status; order.paymentStatus = "PAID";
    await assert.rejects(() => atualizarStatusPedido(1, "CANCELADO"), { statusCode: 409 });
    assert.equal(order.status, status);
  }
  assert.equal(increments, 0);
});

// --- Reconciliation queue (approved decision, 02/11/2026) ---
const all = () => [...pendencias.values()];
test("late approval on a cancelled order is queued as provider-confirmed, once, and never re-reserves stock", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  nextPayment.status = "approved";
  const late = await webhook("late-1");
  assert.equal(late.reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION"); assert.ok(late.conciliacaoId);
  assert.equal(all().length, 1);
  const [item] = all();
  assert.equal(item.tipo, "PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO"); assert.equal(item.verificacao, "CONFIRMADO_PELO_PROVEDOR");
  assert.equal(item.pedidoId, 1); assert.equal(item.paymentId, "1"); assert.equal(item.statusProvedor, "approved"); assert.equal(item.valorProvedor, 10);
  assert.equal(order.status, "CANCELADO"); assert.equal(order.paidAt, null); assert.equal(stock, 5); assert.equal(increments, 1);
  assert.deepEqual(history.map(h => h.acao), ["REGISTRADA"]);
});
test("duplicate and repeated notifications of the same payment count occurrences without duplicating the item", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  nextPayment.status = "approved";
  await webhook("dup-1"); await webhook("dup-1"); await webhook("dup-2");
  await Promise.all([webhook("dup-3"), webhook("dup-4")]);
  assert.equal(all().length, 1); assert.equal(all()[0].ocorrencias, 5);
  assert.deepEqual(history.map(h => h.acao), ["REGISTRADA", "REOCORRENCIA", "REOCORRENCIA", "REOCORRENCIA", "REOCORRENCIA"]);
  assert.equal(stock, 5); assert.equal(increments, 1);
});
test("non-money events on a cancelled order are not queued (rejected, pending)", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  for (const status of ["rejected", "pending", "in_process"]) { nextPayment.status = status; await webhook(status); }
  assert.equal(all().length, 0);
});
test("approved amount mismatch is queued as NOT verified and leaves order and stock untouched", async () => {
  nextPayment.status = "approved"; nextPayment.transaction_amount = 99;
  const result = await webhook("amount");
  assert.equal(result.reason, "PAYMENT_AMOUNT_MISMATCH"); assert.ok(result.conciliacaoId);
  const [item] = all();
  assert.equal(item.tipo, "DIVERGENCIA_VALOR"); assert.equal(item.verificacao, "NAO_VERIFICADO"); assert.equal(item.valorProvedor, 99); assert.equal(item.valorPedido, 10);
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "PENDING"); assert.equal(order.paidAt, null); assert.equal(increments, 0);
});
test("non-approved amount mismatch is not money: nothing queued", async () => {
  nextPayment.status = "pending"; nextPayment.transaction_amount = 99;
  assert.equal((await webhook("pending-amount")).reason, "PAYMENT_AMOUNT_MISMATCH");
  assert.equal(all().length, 0);
});
test("approved preference mismatch is queued as NOT verified", async () => {
  nextPayment.status = "approved"; nextPayment.preference_id = "someone-elses-preference";
  const result = await webhook("preference");
  assert.equal(result.reason, "PAYMENT_PREFERENCE_MISMATCH");
  const [item] = all(); assert.equal(item.tipo, "DIVERGENCIA_PREFERENCIA"); assert.equal(item.verificacao, "NAO_VERIFICADO");
  assert.equal(item.preferenciaProvedor, "someone-elses-preference"); assert.equal(order.status, "PENDENTE");
});
test("approved payment for an unknown order or unmappable reference is queued without an order link", async () => {
  nextPayment.status = "approved"; nextPayment.external_reference = "not-an-order";
  assert.equal((await webhook("unmappable")).reason, "EXTERNAL_REFERENCE_NOT_MAPPABLE");
  nextPayment.external_reference = "pedido_1"; const previous = prisma.pedido.findUnique;
  replace(prisma.pedido, "findUnique", async () => null);
  assert.equal((await webhook("not-found")).reason, "PEDIDO_NOT_FOUND");
  prisma.pedido.findUnique = previous;
  assert.deepEqual(all().map(item => [item.tipo, item.verificacao, item.pedidoId]).sort(), [["PEDIDO_NAO_ENCONTRADO", "NAO_VERIFICADO", null], ["REFERENCIA_NAO_MAPEAVEL", "NAO_VERIFICADO", null]]);
});
test("seller/environment divergence stays refused (403) but is queued as suspicious", async () => {
  nextPayment.status = "approved"; nextPayment.collector_id = 999;
  await assert.rejects(() => webhook("suspicious"), { statusCode: 403 });
  const [item] = all(); assert.equal(item.tipo, "VENDEDOR_OU_AMBIENTE_DIVERGENTE"); assert.equal(item.verificacao, "SUSPEITO"); assert.equal(item.pedidoId, null);
  assert.equal(order.status, "PENDENTE");
});
test("refund/chargeback reported for a paid order is queued and never regresses the order", async () => {
  order.status = "PAGO"; order.paymentStatus = "PAID";
  for (const status of ["refunded", "charged_back"]) { nextPayment.status = status; assert.equal((await webhook(status)).reason, "PAYMENT_STATE_REGRESSION"); }
  assert.equal(all().length, 1, "same payment id and type collapse into one item");
  assert.equal(all()[0].tipo, "ESTORNO_OU_CHARGEBACK"); assert.equal(order.status, "PAGO");
  nextPayment.status = "rejected"; await webhook("rejected-old"); assert.equal(all().length, 1, "an old rejected attempt is not a financial event");
});
test("a rolled-back webhook transaction leaves no queue entry (the provider will retry)", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  nextPayment.status = "approved"; failReturn = false;
  const original = prisma.pedido.findUnique;
  beforeCompare = () => {};
  events.set("x", { id: "x" });
  let thrown = false;
  replace(prisma.pedido, "findUnique", async () => { thrown = true; throw new Error("simulated database outage"); });
  await assert.rejects(() => webhook("outage"), /simulated database outage/);
  prisma.pedido.findUnique = original;
  assert.ok(thrown); assert.equal(all().length, 0);
});

// --- Approved decision: in_process (and other non-final provider states) is never money received ---
for (const status of ["pending", "in_process", "authorized", "in_mediation"]) {
  test(`provider status ${status} keeps the order pending, queues nothing, and a later approval still applies`, async () => {
    nextPayment.status = status;
    const first = await webhook(`${status}-1`);
    assert.equal(first.updated, true);
    assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "PENDING"); assert.equal(order.paidAt, null);
    assert.equal(increments, 0); assert.equal(stock, 3); assert.equal(all().length, 0);
    assert.equal(order.paymentId, "1", "the payment under way is tracked for the next notifications");
    await webhook(`${status}-2`); // new notification of the same state: followed, still not money
    assert.equal(order.status, "PENDENTE"); assert.equal(order.paidAt, null); assert.equal(all().length, 0);
    nextPayment.status = "approved";
    assert.equal((await webhook(`${status}-approved`)).updated, true);
    assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.ok(order.paidAt);
    assert.equal(all().length, 0, "a normal approval needs no reconciliation");
  });
}
test("in_process never becomes money on a cancelled or already paid order and is not queued", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  nextPayment.status = "in_process";
  assert.equal((await webhook("late-in-process")).reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION");
  assert.equal(all().length, 0); assert.equal(order.status, "CANCELADO"); assert.equal(order.paidAt, null);
  order.status = "PAGO"; order.paymentStatus = "PAID"; order.paidAt = new Date().toISOString();
  assert.equal((await webhook("paid-in-process")).reason, "PAYMENT_STATE_REGRESSION");
  assert.equal(all().length, 0); assert.equal(order.status, "PAGO");
});
test("in_process with a different amount or preference is not queued (only approved events can be money)", async () => {
  nextPayment.status = "in_process"; nextPayment.transaction_amount = 99;
  assert.equal((await webhook("in-process-amount")).reason, "PAYMENT_AMOUNT_MISMATCH");
  nextPayment.transaction_amount = 10; nextPayment.preference_id = "other-preference";
  assert.equal((await webhook("in-process-preference")).reason, "PAYMENT_PREFERENCE_MISMATCH");
  assert.equal(all().length, 0);
});

// ---------------------------------------------------------------- frete x conciliação do webhook (Etapa 4.3.8, mocks)
test("webhook com frete: pagamento aprovado no valor de produtos + frete (valorTotal) confirma o pedido", async () => {
  Object.assign(order, { valorTotal: 134, valorFrete: 50 }); // 2 x R$ 42,00 + frete R$ 50,00
  Object.assign(nextPayment, { status: "approved", transaction_amount: 134 });
  assert.equal((await webhook("frete-ok")).updated, true);
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.ok(order.paidAt); assert.equal(all().length, 0);
});
test("webhook com frete: pagamento só com o valor dos produtos (sem frete) é divergência não verificada e não paga o pedido", async () => {
  Object.assign(order, { valorTotal: 134, valorFrete: 50 });
  Object.assign(nextPayment, { status: "approved", transaction_amount: 84 });
  const result = await webhook("frete-faltando");
  assert.equal(result.reason, "PAYMENT_AMOUNT_MISMATCH");
  const [item] = all();
  assert.equal(item.tipo, "DIVERGENCIA_VALOR"); assert.equal(item.verificacao, "NAO_VERIFICADO"); assert.equal(item.valorProvedor, 84); assert.equal(item.valorPedido, 134);
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paidAt, null);
});
test("webhook com frete grátis: pedido acima de R$ 799 (valorFrete 0) é confirmado pelo valor integral", async () => {
  Object.assign(order, { valorTotal: 800, valorFrete: 0 });
  Object.assign(nextPayment, { status: "approved", transaction_amount: 800 });
  assert.equal((await webhook("frete-gratis")).updated, true);
  assert.equal(order.status, "PAGO");
});
test("webhook com pedido antigo (sem frete, valorFrete 0 por padrão da migração) continua conciliando pelo valorTotal anterior", async () => {
  Object.assign(order, { valorTotal: 349.9, valorFrete: 0 });
  Object.assign(nextPayment, { status: "approved", transaction_amount: 349.9 });
  assert.equal((await webhook("pedido-antigo")).updated, true);
  assert.equal(order.status, "PAGO");
});
test("webhook com frete: valor pago com frete a mais ou a menos (centavos) fora da tolerância é recusado", async () => {
  Object.assign(order, { valorTotal: 134, valorFrete: 50 });
  for (const [i, amount] of [133.98, 134.02, 184, 0].entries()) {
    Object.assign(nextPayment, { status: "approved", transaction_amount: amount });
    assert.equal((await webhook(`frete-fora-${i}`)).reason, "PAYMENT_AMOUNT_MISMATCH", `valor ${amount}`);
  }
  assert.equal(order.status, "PENDENTE");
});
