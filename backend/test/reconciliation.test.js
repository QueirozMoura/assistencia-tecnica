import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

Object.assign(process.env, { NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture", DEV_DATABASE_HOST: "127.0.0.1" });
const prisma = (await import("../src/config/prisma.js")).default;
const service = await import("../src/services/conciliacao.service.js");
const { conciliacaoStatusSchema, conciliacaoQuerySchema } = await import("../src/validators/conciliacao.validator.js");
const hash = "a".repeat(64);

test("idempotency key: provider-verified numeric payment id wins", () => {
  assert.deepEqual(service.buildIdempotencyKey({ paymentId: 123, notificationId: "n", rawPayloadHash: hash }), { chave: "pid:123", paymentId: "123" });
  assert.deepEqual(service.buildIdempotencyKey({ paymentId: "98765", rawPayloadHash: hash }), { chave: "pid:98765", paymentId: "98765" });
});
test("idempotency key: unreliable payment ids never become identity; falls back to notification then payload hash", () => {
  for (const bad of [null, undefined, "", "abc", "1; DROP TABLE pedidos", "123456789012345678901", "12 3", -1.5]) {
    assert.deepEqual(service.buildIdempotencyKey({ paymentId: bad, notificationId: "note-7", rawPayloadHash: hash }), { chave: "nid:note-7", paymentId: null }, String(bad));
    assert.deepEqual(service.buildIdempotencyKey({ paymentId: bad, rawPayloadHash: hash }), { chave: `hash:${hash}`, paymentId: null }, String(bad));
  }
  assert.throws(() => service.buildIdempotencyKey({ paymentId: null, rawPayloadHash: "not-a-hash" }), /Hash do payload/);
});
test("classification: only a provider-read, order-attributed payment is confirmed; every divergence is NOT verified", () => {
  assert.equal(service.verificacaoDoTipo("PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO"), "CONFIRMADO_PELO_PROVEDOR");
  assert.equal(service.verificacaoDoTipo("ESTORNO_OU_CHARGEBACK"), "CONFIRMADO_PELO_PROVEDOR");
  for (const tipo of ["DIVERGENCIA_VALOR", "DIVERGENCIA_PREFERENCIA", "PEDIDO_NAO_ENCONTRADO", "REFERENCIA_NAO_MAPEAVEL"]) assert.equal(service.verificacaoDoTipo(tipo), "NAO_VERIFICADO");
  assert.equal(service.verificacaoDoTipo("VENDEDOR_OU_AMBIENTE_DIVERGENTE"), "SUSPEITO");
  assert.throws(() => service.verificacaoDoTipo("OUTRO"), /inválido/);
});
test("money is displayed as confirmed only for provider-confirmed approved payments", () => {
  assert.equal(service.isMoneyConfirmed({ verificacao: "CONFIRMADO_PELO_PROVEDOR", statusProvedor: "approved" }), true);
  assert.equal(service.isMoneyConfirmed({ verificacao: "CONFIRMADO_PELO_PROVEDOR", statusProvedor: "refunded" }), false);
  assert.equal(service.isMoneyConfirmed({ verificacao: "NAO_VERIFICADO", statusProvedor: "approved" }), false);
  assert.equal(service.isMoneyConfirmed({ verificacao: "SUSPEITO", statusProvedor: "approved" }), false);
  assert.equal(service.isMoneyConfirmed(null), false);
});
test("status transitions: open items advance, resolved items are terminal, no reopening or repeats", () => {
  for (const next of ["EM_ANALISE", ...service.STATUS_FINAIS]) service.assertStatusTransition("PENDENTE", next);
  for (const next of service.STATUS_FINAIS) service.assertStatusTransition("EM_ANALISE", next);
  for (const [from, to] of [["EM_ANALISE", "PENDENTE"], ["EM_ANALISE", "EM_ANALISE"], ["PENDENTE", "PENDENTE"], ["REEMBOLSADO_MANUALMENTE", "PENDENTE"],
    ["RESOLVIDO_SEM_REEMBOLSO", "REEMBOLSADO_MANUALMENTE"], ["FALSO_POSITIVO", "EM_ANALISE"], ["INVALIDO", "PENDENTE"]]) {
    assert.throws(() => service.assertStatusTransition(from, to), { statusCode: 409 }, `${from} -> ${to}`);
  }
});
test("validator: final status needs a justification, PENDENTE is not a manual target, unknown values are rejected", () => {
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "EM_ANALISE" }).success, true);
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "REEMBOLSADO_MANUALMENTE" }).success, false);
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "REEMBOLSADO_MANUALMENTE", observacao: "  " }).success, false);
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "REEMBOLSADO_MANUALMENTE", observacao: "Reembolso feito no painel MP, ref. interna 42" }).success, true);
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "PENDENTE" }).success, false);
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "APAGADO", observacao: "xxxx" }).success, false);
  assert.equal(conciliacaoStatusSchema.safeParse({ status: "EM_ANALISE", observacao: "x".repeat(1001) }).success, false);
  assert.equal(conciliacaoQuerySchema.parse({}).limit, 20);
  assert.equal(conciliacaoQuerySchema.safeParse({ limit: "101" }).success, false);
  assert.equal(conciliacaoQuerySchema.safeParse({ tipo: "QUALQUER" }).success, false);
});

// --- manual resolution with compare-and-swap + audit history (transaction harness) ---
let row, history, queue; const restore = [];
const replace = (target, key, value) => { const previous = target[key]; target[key] = value; restore.push(() => { target[key] = previous; }); };
beforeEach(() => {
  row = { id: 1, status: "PENDENTE", observacao: null, resolvidoPorId: null, resolvidoEm: null }; history = []; queue = Promise.resolve();
  const model = {
    findUnique: async args => (args.select?.historico ? { ...row, historico: history, valorProvedor: null, valorPedido: null, verificacao: "NAO_VERIFICADO", statusProvedor: "approved" } : { ...row }),
    updateMany: async ({ where, data }) => { if (row.status !== where.status) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
  };
  const tx = { pagamentoConciliacao: model, pagamentoConciliacaoHistorico: { create: async ({ data }) => { history.push({ ...data, createdAt: new Date() }); } } };
  replace(prisma, "pagamentoConciliacao", model);
  replace(prisma, "$transaction", callback => {
    const run = queue.then(async () => { const snapshot = { row: { ...row }, history: [...history] }; try { return await callback(tx); } catch (error) { ({ row, history } = snapshot); throw error; } });
    queue = run.catch(() => {}); return run;
  });
});
afterEach(() => { while (restore.length) restore.pop()(); });

test("manual resolution records who, when and a history row; the item becomes terminal", async () => {
  await service.atualizarStatusPendencia(1, { status: "EM_ANALISE" }, 7);
  const result = await service.atualizarStatusPendencia(1, { status: "REEMBOLSADO_MANUALMENTE", observacao: "Reembolso manual no painel" }, 8);
  assert.equal(row.status, "REEMBOLSADO_MANUALMENTE"); assert.equal(row.resolvidoPorId, 8); assert.ok(row.resolvidoEm instanceof Date);
  assert.deepEqual(history.map(h => [h.acao, h.statusAnterior, h.statusNovo, h.usuarioId]), [["STATUS_ALTERADO", "PENDENTE", "EM_ANALISE", 7], ["STATUS_ALTERADO", "EM_ANALISE", "REEMBOLSADO_MANUALMENTE", 8]]);
  assert.equal(result.id, 1);
  await assert.rejects(() => service.atualizarStatusPendencia(1, { status: "RESOLVIDO_SEM_REEMBOLSO", observacao: "outra tentativa" }, 9), { statusCode: 409 });
  assert.equal(row.resolvidoPorId, 8); assert.equal(history.length, 2);
});
test("two administrators resolving at once: exactly one wins, the other gets 409 and no extra history", async () => {
  const outcomes = await Promise.allSettled([
    service.atualizarStatusPendencia(1, { status: "REEMBOLSADO_MANUALMENTE", observacao: "feito pelo admin A" }, 7),
    service.atualizarStatusPendencia(1, { status: "RESOLVIDO_SEM_REEMBOLSO", observacao: "feito pelo admin B" }, 8),
  ]);
  assert.deepEqual(outcomes.map(o => o.status).sort(), ["fulfilled", "rejected"]);
  assert.equal(outcomes.find(o => o.status === "rejected").reason.statusCode, 409);
  assert.equal(history.length, 1); assert.equal(row.resolvidoPorId, history[0].usuarioId);
});
test("stale read: a change landing between read and write is detected by the compare, not overwritten", async () => {
  const model = prisma.pagamentoConciliacao; const original = model.updateMany;
  model.updateMany = async args => { row.status = "EM_ANALISE"; return original(args); };
  await assert.rejects(() => service.atualizarStatusPendencia(1, { status: "EM_ANALISE" }, 7), { statusCode: 409 });
  assert.equal(history.length, 0);
});
test("a missing item is 404 and a missing responsible user is refused before any write", async () => {
  row = null; const model = prisma.pagamentoConciliacao; model.findUnique = async () => null;
  await assert.rejects(() => service.atualizarStatusPendencia(99, { status: "EM_ANALISE" }, 7), { statusCode: 404 });
  await assert.rejects(() => service.atualizarStatusPendencia(1, { status: "EM_ANALISE" }, undefined), { statusCode: 401 });
  assert.equal(history.length, 0);
});
