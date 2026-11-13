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
beforeEach(() => {
  preferencias = [];
  globalThis.fetch = async (url, options) => {
    if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 777, tags: ["test_user"] }) };
    if (url === "https://api.mercadopago.com/checkout/preferences") {
      preferencias.push(JSON.parse(options.body));
      return { ok: true, status: 201, json: async () => ({ id: "fixture-pref", init_point: "https://www.mercadopago.com.br/checkout/fixture" }) };
    }
    throw new Error(`Rede proibida nos testes: ${url}`);
  };
  salvamentos = stub(prisma.pedido, "updateMany", async () => ({ count: 1 }));
  stub(prisma.pedido, "findUnique", async () => { throw new Error("pedido de teste não configurado"); });
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
    id: 1, clienteId: 7, status: "PENDENTE", paymentStatus: "PENDING", paidAt: null, preferenceId: null,
    valorTotal: dec("449.98"), valorFrete: dec("50"), cliente,
    itens: [
      { produtoId: 2, quantidade: 1, precoUnitario: dec("299.99"), produto: { id: 2, nome: "Micro-ondas B" } },
      { produtoId: 3, quantidade: 1, precoUnitario: dec("99.99"), produto: { id: 3, nome: "Peça C" } },
    ],
    ...extra,
  };
}
const somaCentavos = (body) => body.items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0);

async function chamar(pedido, body = {}) {
  stub(prisma.pedido, "findUnique", async () => pedido);
  const req = { params: { pedidoId: String(pedido.id) }, body, query: {}, cliente: { id: pedido.clienteId } };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  let erro = null;
  await criarPreferencia(req, res, (e) => { erro = e; });
  return { res, erro };
}

test("criar-preferencia: pedido com frete de R$ 50 envia a linha de frete e a soma é igual ao valorTotal", async () => {
  const { res, erro } = await chamar(pedidoDoBanco());
  assert.equal(erro, null);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.preferenceId, "fixture-pref");
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
