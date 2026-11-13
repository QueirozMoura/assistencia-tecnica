import test, { beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

// Configuração sintética: nunca usa o banco real nem a rede nem o Mercado Pago real.
Object.assign(process.env, {
  NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
  DEV_DATABASE_HOST: "127.0.0.1", JWT_SECRET: "synthetic-admin-key", JWT_CLIENT_SECRET: "synthetic-client-key",
  EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock",
  MERCADO_PAGO_MODE: "test", MERCADO_PAGO_ACCESS_TOKEN: "fixture-only", MERCADO_PAGO_TEST_SELLER_ID: "777",
  FRONTEND_URL: "http://localhost:5173", MERCADO_PAGO_NOTIFICATION_URL: "",
  MERCADO_PAGO_SUCCESS_URL: "http://localhost:5173/pagamento/sucesso",
  MERCADO_PAGO_FAILURE_URL: "http://localhost:5173/checkout", MERCADO_PAGO_PENDING_URL: "http://localhost:5173/checkout/pendente",
});
const prisma = (await import("../src/config/prisma.js")).default;
const { Prisma } = await import("@prisma/client");
const { criarPreferencia } = await import("../src/controllers/pagamento.controller.js");
const { createMercadoPagoPreference } = await import("../src/services/pagamento.service.js");

const originalFetch = globalThis.fetch;
const restorations = [];
function stub(target, method, implementation) {
  const previous = target[method];
  const calls = [];
  target[method] = function (...args) { calls.push(args); return implementation.apply(this, args); };
  target[method].calls = calls;
  restorations.push(() => { target[method] = previous; });
  return target[method];
}

let preferencias; // corpos enviados à criação de preferência (rede simulada)
let salvamentos; // chamadas a prisma.pedido.updateMany
let store; // pedido "persistido": findUnique/updateMany operam sobre ele, como o banco faria
let transacoes; // fila que simula o bloqueio de linha (FOR UPDATE): transações do mesmo pedido executam uma por vez
let falhaMercadoPago; // quando true, a criação da preferência responde 500
beforeEach(() => {
  preferencias = []; store = null; falhaMercadoPago = false; transacoes = Promise.resolve();
  globalThis.fetch = async (url, options) => {
    if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 777, tags: ["test_user"] }) };
    if (url === "https://api.mercadopago.com/checkout/preferences") {
      if (falhaMercadoPago) return { ok: false, status: 500, statusText: "Server Error", json: async () => ({ message: "falha simulada" }) };
      preferencias.push(JSON.parse(options.body));
      const n = preferencias.length; // cada preferência criada tem identificador e link próprios
      return { ok: true, status: 201, json: async () => ({ id: `fixture-pref-${n}`, init_point: `https://www.mercadopago.com.br/checkout/fixture-${n}` }) };
    }
    throw new Error(`Rede proibida nos testes: ${url}`);
  };
  salvamentos = stub(prisma.pedido, "updateMany", async ({ where, data }) => {
    if (!store || Object.entries(where).some(([campo, valor]) => store[campo] !== valor)) return { count: 0 };
    Object.assign(store, data); return { count: 1 };
  });
  stub(prisma.pedido, "findUnique", async () => { if (!store) throw new Error("pedido de teste não configurado"); return { ...store }; });
  stub(prisma, "$queryRaw", async () => [{ id: store?.id }]);
  stub(prisma, "$transaction", (callback) => { const execucao = transacoes.then(() => callback(prisma)); transacoes = execucao.catch(() => {}); return execucao; });
});
afterEach(() => {
  mock.restoreAll();
  while (restorations.length) restorations.pop()();
  globalThis.fetch = originalFetch;
});

const dec = (valor) => new Prisma.Decimal(valor); // o Prisma devolve Decimal, não number
const cliente = { id: 7, nome: "Cliente fictício", email: "preferencia@example.invalid" };
function pedidoDoBanco(extra = {}) {
  return {
    id: 1, clienteId: 7, status: "PENDENTE", paymentStatus: "PENDING", paidAt: null, preferenceId: null, checkoutInitPoint: null,
    valorTotal: dec("449.98"), valorFrete: dec("50"), cliente,
    itens: [
      { produtoId: 2, quantidade: 1, precoUnitario: dec("299.99"), produto: { id: 2, nome: "Micro-ondas B" } },
      { produtoId: 3, quantidade: 1, precoUnitario: dec("99.99"), produto: { id: 3, nome: "Peça C" } },
    ],
    ...extra,
  };
}
const somaCentavos = (body) => body.items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0);

async function chamar(pedido, body = {}, solicitante = { id: pedido.clienteId }) {
  store = pedido;
  const req = { params: { pedidoId: String(pedido.id) }, body, query: {}, cliente: solicitante };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  let erro = null;
  await criarPreferencia(req, res, (e) => { erro = e; });
  return { res, erro };
}

test("criar-preferencia: pedido com frete de R$ 50 envia a linha de frete e a soma é igual ao valorTotal", async () => {
  const { res, erro } = await chamar(pedidoDoBanco());
  assert.equal(erro, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.preferenceId, "fixture-pref-1");
  assert.equal(preferencias.length, 1);
  const [pref] = preferencias;
  assert.equal(pref.items.length, 3);
  assert.deepEqual(pref.items[2], { id: "frete", title: "Frete", quantity: 1, unit_price: 50, currency_id: "BRL" });
  assert.equal(somaCentavos(pref), 44998); // 299,99 + 99,99 + 50,00 == valorTotal 449,98
  assert.equal(salvamentos.calls.length, 1, "preferenceId salvo uma única vez");
});

test("criar-preferencia: frete grátis (valorFrete 0) não envia linha de frete", async () => {
  const pedido = pedidoDoBanco({
    valorTotal: dec("899.98"), valorFrete: dec("0"),
    itens: [{ produtoId: 1, quantidade: 2, precoUnitario: dec("449.99"), produto: { id: 1, nome: "Máquina A" } }],
  });
  const { res, erro } = await chamar(pedido);
  assert.equal(erro, null);
  assert.equal(res.statusCode, 200);
  const [pref] = preferencias;
  assert.equal(pref.items.length, 1);
  assert.ok(!pref.items.some((i) => i.id === "frete"));
  assert.equal(somaCentavos(pref), 89998);
});

test("criar-preferencia: pedido antigo sem valorFrete (campo ausente ou nulo) é tratado como frete 0", async () => {
  for (const valorFrete of [undefined, null]) {
    preferencias.length = 0;
    const antigo = pedidoDoBanco({ valorTotal: dec("399.98") });
    if (valorFrete === undefined) delete antigo.valorFrete; else antigo.valorFrete = valorFrete;
    const { res, erro } = await chamar(antigo);
    assert.equal(erro, null, `valorFrete=${valorFrete}`);
    assert.equal(res.statusCode, 200);
    assert.equal(preferencias[0].items.length, 2);
    assert.equal(somaCentavos(preferencias[0]), 39998);
  }
});

test("criar-preferencia: o frete vem do pedido persistido; valores enviados no corpo da requisição são ignorados", async () => {
  const { erro } = await chamar(pedidoDoBanco(), { valorFrete: 0, frete: 0, valorTotal: 1, itens: [] });
  assert.equal(erro, null);
  const [pref] = preferencias;
  assert.equal(pref.items.find((i) => i.id === "frete")?.unit_price, 50);
  assert.equal(somaCentavos(pref), 44998);
});

test("criar-preferencia: total divergente é recusado antes de chamar a criação da preferência e nada é salvo", async () => {
  const casos = {
    "valorTotal maior que itens + frete": pedidoDoBanco({ valorTotal: dec("500.00") }),
    "valorTotal sem frete embora o pedido tenha frete": pedidoDoBanco({ valorTotal: dec("399.98") }),
    "frete zerado em pedido cujo total inclui frete": pedidoDoBanco({ valorFrete: dec("0") }),
  };
  for (const [nome, pedido] of Object.entries(casos)) {
    const { res, erro } = await chamar(pedido);
    assert.match(erro?.message ?? "", /divergente/, nome);
    assert.equal(erro.statusCode, 500, nome);
    assert.equal(res.body, undefined, nome);
  }
  assert.equal(preferencias.length, 0, "nenhuma preferência criada no Mercado Pago");
  assert.equal(salvamentos.calls.length, 0, "nenhum preferenceId salvo");
});

test("criar-preferencia: pedido já pago continua recusado (409) e não chama o Mercado Pago", async () => {
  const { erro } = await chamar(pedidoDoBanco({ status: "PAGO", paymentStatus: "PAID", paidAt: new Date() }));
  assert.equal(erro?.statusCode, 409);
  assert.equal(preferencias.length, 0);
});

// ---------------------------------------------------------------- P1.2 fase 1: criarPreferencia idempotente
const LINK_1 = "https://www.mercadopago.com.br/checkout/fixture-1";
test("P1.2 a primeira chamada grava preferência, link e referência no pedido", async () => {
  const pedido = pedidoDoBanco();
  const { res, erro } = await chamar(pedido);
  assert.equal(erro, null); assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.reutilizada, false); assert.equal(res.body.data.init_point, LINK_1);
  assert.equal(pedido.preferenceId, "fixture-pref-1"); assert.equal(pedido.externalReference, "pedido_1"); assert.equal(pedido.checkoutInitPoint, LINK_1);
});
test("P1.2 chamadas repetidas devolvem a mesma preferência, sem criar outra nem regravar o pedido", async () => {
  const pedido = pedidoDoBanco(); const respostas = [];
  for (let i = 0; i < 3; i++) { const { res, erro } = await chamar(pedido); assert.equal(erro, null); respostas.push(res.body.data); }
  assert.equal(preferencias.length, 1, "uma única preferência criada no Mercado Pago");
  assert.equal(salvamentos.calls.length, 1, "o pedido foi gravado uma única vez");
  assert.deepEqual(respostas.map((r) => r.preferenceId), ["fixture-pref-1", "fixture-pref-1", "fixture-pref-1"]);
  assert.deepEqual(respostas.map((r) => r.init_point), [LINK_1, LINK_1, LINK_1]);
  assert.deepEqual(respostas.map((r) => r.reutilizada), [false, true, true]);
  assert.equal(pedido.preferenceId, "fixture-pref-1");
});
test("P1.2 chamadas simultâneas criam uma única preferência e todas recebem o mesmo link; valores e frete ficam intactos", async () => {
  const pedido = pedidoDoBanco();
  const resultados = await Promise.all(Array.from({ length: 5 }, () => chamar(pedido)));
  assert.ok(resultados.every(({ erro }) => erro === null));
  assert.equal(preferencias.length, 1); assert.equal(salvamentos.calls.length, 1);
  assert.equal(new Set(resultados.map(({ res }) => res.body.data.preferenceId)).size, 1);
  assert.equal(resultados.filter(({ res }) => res.body.data.reutilizada === false).length, 1);
  assert.equal(somaCentavos(preferencias[0]), 44998); assert.deepEqual(preferencias[0].items.at(-1), { id: "frete", title: "Frete", quantity: 1, unit_price: 50, currency_id: "BRL" });
  assert.equal(preferencias[0].external_reference, "pedido_1"); assert.equal(pedido.preferenceId, "fixture-pref-1");
});
for (const [status, paymentStatus] of [["PAGO", "PAID"], ["PREPARANDO", "PAID"], ["ENVIADO", "PAID"], ["ENTREGUE", "PAID"], ["CANCELADO", "FAILED"], ["CANCELADO", "PENDING"]]) {
  test(`P1.2 pedido ${status}/${paymentStatus} com preferência existente: 409, nenhuma preferência nova e o link não é exposto`, async () => {
    const pedido = pedidoDoBanco({ status, paymentStatus, preferenceId: "fixture-pref-antiga", checkoutInitPoint: "https://www.mercadopago.com.br/checkout/antigo", paidAt: paymentStatus === "PAID" ? new Date() : null });
    const { res, erro } = await chamar(pedido);
    assert.equal(erro?.statusCode, 409); assert.equal(res.body, undefined);
    assert.equal(preferencias.length, 0); assert.equal(salvamentos.calls.length, 0); assert.equal(pedido.preferenceId, "fixture-pref-antiga");
  });
}
test("P1.2 pedido confirmado entre a autorização e o bloqueio da linha também é recusado, sem nova preferência", async () => {
  const pedido = pedidoDoBanco();
  stub(prisma, "$queryRaw", async () => { Object.assign(store, { status: "PAGO", paymentStatus: "PAID", paidAt: new Date() }); return [{ id: 1 }]; });
  const { res, erro } = await chamar(pedido);
  assert.equal(erro?.statusCode, 409); assert.equal(res.body, undefined);
  assert.equal(preferencias.length, 0); assert.equal(pedido.preferenceId, null);
});
test("P1.2 pedido com preferenceId mas sem link salvo não ganha outra preferência (o vínculo com o webhook é preservado)", async () => {
  const pedido = pedidoDoBanco({ preferenceId: "fixture-pref-antiga" });
  const { res, erro } = await chamar(pedido);
  assert.equal(erro?.statusCode, 409); assert.equal(res.body, undefined);
  assert.equal(preferencias.length, 0); assert.equal(salvamentos.calls.length, 0); assert.equal(pedido.preferenceId, "fixture-pref-antiga");
});
test("P1.2 falha do Mercado Pago ao criar a preferência não grava nada e permite uma nova tentativa", async () => {
  const pedido = pedidoDoBanco(); falhaMercadoPago = true;
  const falha = await chamar(pedido);
  assert.equal(falha.erro?.statusCode, 502); assert.equal(pedido.preferenceId, null); assert.equal(salvamentos.calls.length, 0);
  falhaMercadoPago = false;
  const nova = await chamar(pedido);
  assert.equal(nova.erro, null); assert.equal(nova.res.body.data.preferenceId, "fixture-pref-1"); assert.equal(nova.res.body.data.reutilizada, false);
});
test("P1.2 a autorização é preservada: outro cliente, sem token, não cria nem recebe a preferência", async () => {
  const semPreferencia = pedidoDoBanco();
  let r = await chamar(semPreferencia, {}, { id: 99 });
  assert.equal(r.erro?.statusCode, 403); assert.equal(r.res.body, undefined); assert.equal(preferencias.length, 0); assert.equal(semPreferencia.preferenceId, null);
  const comPreferencia = pedidoDoBanco({ preferenceId: "fixture-pref-antiga", checkoutInitPoint: "https://www.mercadopago.com.br/checkout/antigo" });
  r = await chamar(comPreferencia, {}, { id: 99 });
  assert.equal(r.erro?.statusCode, 403); assert.equal(r.res.body, undefined, "o link de outro cliente não é exposto");
});

// ---------------------------------------------------------------- P1.2 fase 1: Pix e cartão (boleto excluído)
test("P1.2 a preferência exclui boleto (ticket) e mantém Pix, cartão e saldo; nenhuma expiração é configurada nesta fase", async () => {
  await chamar(pedidoDoBanco());
  const [pref] = preferencias;
  assert.deepEqual(pref.payment_methods, { excluded_payment_types: [{ id: "ticket" }] });
  const excluidos = pref.payment_methods.excluded_payment_types.map((tipo) => tipo.id);
  for (const permitido of ["bank_transfer", "credit_card", "debit_card", "account_money"]) assert.ok(!excluidos.includes(permitido), `${permitido} precisa continuar disponível`);
  assert.equal(pref.payment_methods.excluded_payment_methods, undefined, "nenhum método específico (como pix) é excluído");
  for (const campo of ["expires", "expiration_date_from", "expiration_date_to", "date_of_expiration"]) assert.equal(pref[campo], undefined, `${campo} pertence à fase 3`);
});
test("P1.2 a restrição de modalidades vale na criação do pedido com pagamento (mesma função de preferência)", async () => {
  await createMercadoPagoPreference({ pedido: { id: 5, valorTotal: dec("10.00") }, itens: [{ produtoId: 1, nome: "Item", quantidade: 1, precoUnitario: 10 }], payer: cliente });
  assert.deepEqual(preferencias[0].payment_methods, { excluded_payment_types: [{ id: "ticket" }] });
});
