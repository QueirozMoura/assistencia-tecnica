import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

Object.assign(process.env, {
  NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
  DEV_DATABASE_HOST: "127.0.0.1", EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock",
  MERCADO_PAGO_MODE: "test", MERCADO_PAGO_TEST_SELLER_ID: "123", MERCADO_PAGO_ACCESS_TOKEN: "synthetic-only",
});
const prisma = (await import("../src/config/prisma.js")).default;
const logger = (await import("../src/config/logger.js")).default;
const { atualizarStatusPedido, validarAcessoPagamentoPedido } = await import("../src/services/pedido.service.js");
const { processMercadoPagoWebhook } = await import("../src/services/pagamento.service.js");
const { assertOrderTransition } = await import("../src/services/orderState.js");

let pendencias, history, order, stock, increments, events, nextPayment, beforeCompare, queue, debitEvidence, returned, failReturn, notifications;
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
  // O transporte mock de e-mail registra uma linha por aviso ao administrador de pagamento aprovado: serve para contar envios.
  notifications = 0;
  replace(logger, "info", (...args) => { if (String(args[0]).includes("[email:mock] Notificacao administrativa")) notifications++; return logger; });
  nextPayment = { id: 1, collector_id: 123, live_mode: false, external_reference: "pedido_1", preference_id: "fixture-preference", status: "pending", transaction_amount: 10 };
  globalThis.fetch = async url => {
    if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 123, tags: ["test_user"] }) };
    // Qualquer ID de pagamento devolve o estado atual simulado; o ID da resposta é o consultado (cada tentativa tem o seu).
    const paymentUrl = /^https:\/\/api\.mercadopago\.com\/v1\/payments\/(\d+)$/.exec(url);
    if (paymentUrl) return { ok: true, status: 200, json: async () => ({ ...copy(nextPayment), id: Number(paymentUrl[1]) }) };
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
const webhook = (id = "fixture-event", paymentId = 1) => processMercadoPagoWebhook({ id, type: "payment", data: { id: paymentId }, live_mode: false });

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
test("rejected payment never releases stock: repeated rejections keep the order reserved and a later approval pays it", async () => {
  nextPayment.status = "rejected";
  await webhook("rejected-1"); await webhook("rejected-2");
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "FAILED");
  assert.equal(stock, 3); assert.equal(increments, 0);
  nextPayment.status = "approved"; await webhook("later-approved");
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID");
  assert.equal(stock, 3); assert.equal(increments, 0);
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
test("a rejected payment never touches the stock ledger, so a ledger failure cannot affect the webhook", async () => {
  failReturn = true; nextPayment.status = "rejected";
  assert.equal((await webhook()).updated, true);
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "FAILED");
  assert.equal(stock, 3); assert.equal(increments, 0); assert.equal(events.size, 1);
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

// ---------------------------------------------------------------- P1.1: recusa/cancelamento de UMA tentativa não cancela o pedido
// Cada tentativa de pagamento tem o seu ID. Uma recusa registra a tentativa (paymentStatus FAILED) e mantém o pedido PENDENTE,
// com o estoque reservado, para que uma nova tentativa aprovada ainda seja aceita. Só dinheiro aprovado confirma o pedido.
let seq = 0;
const notify = (paymentId, status) => { nextPayment.status = status; return webhook(`p11-${++seq}`, paymentId); };

for (const status of ["rejected", "cancelled", "cancelled_by_user"]) {
  test(`P1.1 provider status ${status} records the failed attempt but keeps the order PENDENTE, reserved and payable`, async () => {
    assert.equal((await notify(7, status)).updated, true);
    assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "FAILED"); assert.equal(order.paymentId, "7"); assert.equal(order.paidAt, null);
    assert.equal(increments, 0); assert.equal(stock, 3, "the reservation is kept for the next attempt");
    assert.equal(all().length, 0, "a refused attempt is not money: nothing is queued");
    assert.ok((await validarAcessoPagamentoPedido({ pedidoId: 1, clienteId: 1 })).pedido, "the order still accepts a new payment attempt");
  });
}
test("P1.1 rejected then approved (new attempt, new payment id) confirms the order once, without reconciliation or stock movement", async () => {
  await notify(7, "rejected");
  assert.equal(order.status, "PENDENTE");
  assert.equal((await notify(8, "approved")).updated, true);
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.ok(order.paidAt); assert.equal(order.paymentId, "8");
  assert.equal(all().length, 0); assert.equal(increments, 0); assert.equal(stock, 3);
});
test("P1.1 rejected, then a new attempt in process, then approved still ends PAGO", async () => {
  await notify(7, "rejected"); await notify(8, "in_process");
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "PENDING");
  await notify(8, "approved");
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.equal(order.paymentId, "8");
  assert.equal(all().length, 0); assert.equal(increments, 0); assert.equal(stock, 3);
});
for (const late of ["rejected", "cancelled"]) {
  test(`P1.1 a late ${late} notification of an earlier attempt cannot revert an order already paid`, async () => {
    await notify(8, "approved"); const paidAt = order.paidAt;
    assert.equal((await notify(7, late)).reason, "PAYMENT_STATE_REGRESSION");
    assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.equal(order.paymentId, "8"); assert.equal(order.paidAt.getTime(), paidAt.getTime());
    assert.equal(all().length, 0, "an old refused attempt is not a financial event"); assert.equal(increments, 0); assert.equal(stock, 3);
  });
}
test("P1.1 duplicated rejected notifications (same event id and different ids) change nothing twice", async () => {
  nextPayment.status = "rejected";
  await webhook("same-rejected", 7);
  assert.equal((await webhook("same-rejected", 7)).reason, "WEBHOOK_ALREADY_PROCESSED");
  await Promise.all([notify(7, "rejected"), notify(7, "rejected")]);
  assert.equal(order.status, "PENDENTE"); assert.equal(order.paymentStatus, "FAILED"); assert.equal(order.paymentId, "7");
  assert.equal(increments, 0); assert.equal(stock, 3); assert.equal(all().length, 0);
});
test("P1.1 duplicated approved notifications keep the first paidAt and never touch stock or the reconciliation queue", async () => {
  nextPayment.status = "approved";
  await webhook("same-approved", 8); const paidAt = order.paidAt;
  assert.equal((await webhook("same-approved", 8)).reason, "WEBHOOK_ALREADY_PROCESSED");
  await Promise.all([webhook("other-approved-1", 8), webhook("other-approved-2", 8)]);
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.equal(order.paidAt.getTime(), paidAt.getTime());
  assert.equal(increments, 0); assert.equal(stock, 3); assert.equal(all().length, 0);
});
test("P1.1 a cancelled payment does not cancel the order; a later approval pays it", async () => {
  await notify(7, "cancelled");
  assert.equal(order.status, "PENDENTE"); assert.equal(increments, 0); assert.equal(stock, 3);
  await notify(8, "approved");
  assert.equal(order.status, "PAGO"); assert.equal(all().length, 0);
});
test("P1.1 an effectively cancelled order keeps its handling: stock returns once and a later approval goes to reconciliation", async () => {
  await notify(7, "rejected");
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal(order.status, "CANCELADO"); assert.equal(stock, 5); assert.equal(increments, 1);
  const late = await notify(8, "approved");
  assert.equal(late.reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION");
  assert.equal(all().length, 1); assert.equal(all()[0].tipo, "PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO"); assert.equal(all()[0].verificacao, "CONFIRMADO_PELO_PROVEDOR");
  assert.equal(order.status, "CANCELADO"); assert.equal(order.paidAt, null); assert.equal(stock, 5); assert.equal(increments, 1, "never reserved or released again");
  await notify(8, "approved"); // same approval notified again
  assert.equal(all().length, 1); assert.equal(all()[0].ocorrencias, 2); assert.equal(increments, 1);
});
test("P1.1 a refused attempt on an order cancelled in the meantime is ignored and not queued as money", async () => {
  await atualizarStatusPedido(1, "CANCELADO");
  assert.equal((await notify(7, "rejected")).reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION");
  assert.equal(all().length, 0); assert.equal(stock, 5); assert.equal(increments, 1);
});

// ---------------------------------------------------------------- P1.2 fase 1: segunda aprovação (outro paymentId) em pedido já pago
// O primeiro pagamento que confirma o pedido é o pagamento do pedido. Uma segunda aprovação com OUTRO paymentId é dinheiro a mais:
// vai para a conciliação manual (nunca reembolso automático) e não sobrescreve paymentId, paymentMethod, paidAt, status nem estoque.
const approvedWith = (paymentId, method) => { nextPayment.payment_method_id = method; return notify(paymentId, "approved"); };

test("P1.2 the same payment approved again under different notification ids is the same charge, not a duplicate", async () => {
  await approvedWith(8, "visa");
  const paidAt = order.paidAt; const sent = notifications;
  assert.ok(sent >= 1, "the first approval notifies the administrator");
  await approvedWith(8, "visa"); await approvedWith(8, "visa");
  assert.equal(all().length, 0, "nothing queued for a repeated notification of the same payment");
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentId, "8"); assert.equal(order.paidAt.getTime(), paidAt.getTime());
  assert.equal(notifications, sent, "no second administrator notification"); assert.equal(increments, 0); assert.equal(stock, 3);
});
test("P1.2 a second approved payment with a different paymentId is queued and never overwrites the original payment", async () => {
  await approvedWith(8, "visa");
  const original = copy(order); const sent = notifications;
  const result = await approvedWith(9, "pix");
  assert.equal(result.ignored, true); assert.equal(result.reason, "DUPLICATE_APPROVED_PAYMENT"); assert.ok(result.conciliacaoId);
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID");
  assert.equal(order.paymentId, "8"); assert.equal(order.paymentMethod, "visa"); assert.equal(order.paidAt.getTime(), original.paidAt.getTime());
  assert.equal(all().length, 1);
  const [item] = all();
  assert.equal(item.tipo, "PAGAMENTO_DUPLICADO"); assert.equal(item.verificacao, "CONFIRMADO_PELO_PROVEDOR"); assert.equal(item.chave, "pid:9");
  assert.equal(item.pedidoId, 1); assert.equal(item.paymentId, "9"); assert.equal(item.statusProvedor, "approved");
  assert.equal(item.valorProvedor, 10); assert.equal(item.valorPedido, 10); assert.equal(item.statusPedido, "PAGO");
  assert.deepEqual(history.map(h => h.acao), ["REGISTRADA"]);
  assert.equal(notifications, sent, "no duplicate administrator notification"); assert.equal(increments, 0); assert.equal(stock, 3, "stock is never released or reserved again");
});
test("P1.2 the duplicate is idempotent by paymentId across different notification ids; another duplicate payment is a separate item", async () => {
  await approvedWith(8, "visa");
  await approvedWith(9, "pix"); await approvedWith(9, "pix"); await approvedWith(9, "pix");
  assert.equal(all().length, 1); assert.equal(all()[0].ocorrencias, 3);
  assert.deepEqual(history.map(h => h.acao), ["REGISTRADA", "REOCORRENCIA", "REOCORRENCIA"]);
  await approvedWith(10, "master");
  assert.deepEqual(all().map(item => item.chave).sort(), ["pid:10", "pid:9"]);
  assert.equal(order.paymentId, "8"); assert.equal(increments, 0); assert.equal(stock, 3);
});
test("P1.2 out-of-order approvals: whichever approval confirmed the order first is kept, the other is queued", async () => {
  await approvedWith(9, "pix");
  await approvedWith(8, "visa");
  assert.equal(order.paymentId, "9"); assert.equal(order.paymentMethod, "pix");
  assert.deepEqual(all().map(item => item.chave), ["pid:8"]);
});
test("P1.2 a second approval that races past the first one is refused by the state check and queued when the provider retries", async () => {
  // A outra transação confirma o pedido com o pagamento 8 entre a leitura e o UPDATE condicional desta aprovação (9).
  const committedByTheOtherTransaction = { status: "PAGO", paymentStatus: "PAID", paidAt: new Date(), paymentId: "8", paymentMethod: "visa" };
  beforeCompare = () => { Object.assign(order, committedByTheOtherTransaction); };
  await assert.rejects(() => approvedWith(9, "pix"), { statusCode: 409 });
  assert.equal(events.size, 0); assert.equal(all().length, 0, "the refused attempt leaves nothing behind");
  // O harness desfaz com a transação que falhou o commit concorrente simulado; no banco real ele é durável. Reaplica.
  Object.assign(order, committedByTheOtherTransaction);
  assert.equal((await approvedWith(9, "pix")).reason, "DUPLICATE_APPROVED_PAYMENT");
  assert.deepEqual(all().map(item => item.chave), ["pid:9"]); assert.equal(order.paymentId, "8");
});
test("P1.2 two approvals in flight at the same time end with exactly one payment on the order and the other queued", async () => {
  nextPayment.status = "approved";
  await Promise.all([webhook("race-a", 8).catch(error => error), webhook("race-b", 9).catch(error => error)]);
  assert.equal(order.status, "PAGO"); assert.equal(order.paymentStatus, "PAID"); assert.ok(["8", "9"].includes(order.paymentId));
  const other = order.paymentId === "8" ? "9" : "8";
  assert.deepEqual(all().map(item => item.chave), [`pid:${other}`]);
  assert.equal(increments, 0); assert.equal(stock, 3);
});
for (const advanced of ["PREPARANDO", "ENVIADO", "ENTREGUE"]) {
  test(`P1.2 a second approved payment on an order already ${advanced} is queued and does not touch the order`, async () => {
    Object.assign(order, { status: advanced, paymentStatus: "PAID", paidAt: new Date(), paymentId: "8", paymentMethod: "visa" });
    assert.equal((await approvedWith(9, "pix")).reason, "DUPLICATE_APPROVED_PAYMENT");
    assert.equal(order.status, advanced); assert.equal(order.paymentId, "8"); assert.equal(order.paymentMethod, "visa");
    assert.deepEqual(all().map(item => item.chave), ["pid:9"]); assert.equal(increments, 0);
  });
}
test("P1.2 an order paid without a recorded paymentId (manual or historical) cannot be told apart, so a real approval is applied as before", async () => {
  Object.assign(order, { status: "PAGO", paymentStatus: null, paidAt: null, paymentId: null });
  assert.equal((await approvedWith(8, "visa")).updated, true);
  assert.equal(order.paymentId, "8"); assert.equal(all().length, 0);
  Object.assign(order, { status: "PENDENTE", paymentStatus: "PAID", paidAt: new Date(), paymentId: null });
  assert.equal((await approvedWith(9, "pix")).updated, true); assert.equal(all().length, 0);
});
test("P1.2 an approval on an effectively cancelled order keeps its own reconciliation type, even when an older attempt is on the order", async () => {
  await notify(7, "rejected");
  await atualizarStatusPedido(1, "CANCELADO");
  const result = await approvedWith(9, "pix");
  assert.equal(result.reason, "ORDER_CANCELLED_REQUIRES_RECONCILIATION");
  assert.deepEqual(all().map(item => [item.tipo, item.chave]), [["PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO", "pid:9"]]);
  assert.equal(order.status, "CANCELADO"); assert.equal(order.paidAt, null); assert.equal(stock, 5); assert.equal(increments, 1);
});
test("P1.2 a second approval with a different amount stays a value divergence, not a duplicate", async () => {
  await approvedWith(8, "visa");
  nextPayment.transaction_amount = 99;
  assert.equal((await approvedWith(9, "pix")).reason, "PAYMENT_AMOUNT_MISMATCH");
  assert.deepEqual(all().map(item => [item.tipo, item.verificacao]), [["DIVERGENCIA_VALOR", "NAO_VERIFICADO"]]);
  assert.equal(order.paymentId, "8"); assert.equal(order.status, "PAGO");
});
test("P1.2 non-approved notifications of another attempt on a paid order are still ignored without queueing", async () => {
  await approvedWith(8, "visa");
  for (const status of ["rejected", "cancelled", "in_process", "pending"]) assert.equal((await notify(9, status)).reason, "PAYMENT_STATE_REGRESSION");
  assert.equal(all().length, 0); assert.equal(order.paymentId, "8"); assert.equal(order.status, "PAGO");
});
