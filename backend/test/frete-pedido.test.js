import test, { beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";

// Configuração sintética: nunca usa o banco real nem a rede.
Object.assign(process.env, {
  NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
  DEV_DATABASE_HOST: "127.0.0.1", JWT_SECRET: "synthetic-admin-key", JWT_CLIENT_SECRET: "synthetic-client-key",
  EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock",
});
const prisma = (await import("../src/config/prisma.js")).default;
const orders = await import("../src/services/pedido.service.js");
const { cotarFrete, exigirFrete } = await import("../src/services/resumoPedido.service.js");
const { createMercadoPagoPreference } = await import("../src/services/pagamento.service.js");
const { freteCotacaoSchema } = await import("../src/validators/frete.validator.js");
const freteRouter = (await import("../src/routes/frete.routes.js")).default;
const orderRouter = (await import("../src/routes/pedido.routes.js")).default;

const CEP_OK = "01310-100"; // São Paulo (capital)
const CEP_FORA = "09600-000"; // São Bernardo do Campo: fora da cobertura
const customer = { id: 1, nome: "Cliente fictício", email: "frete@example.invalid" };
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

beforeEach(() => {
  globalThis.fetch = () => { throw new Error("Rede proibida nos testes de frete"); };
  for (const model of ["cliente", "pedido", "produto", "checkoutAccessToken", "estoqueMovimento"]) {
    for (const method of ["findUnique", "findFirst", "findMany", "create", "update", "updateMany", "count"]) {
      stub(prisma[model], method, () => { throw new Error(`Chamada inesperada ao ORM: ${model}.${method}`); });
    }
  }
  stub(prisma, "$transaction", () => { throw new Error("Transação inesperada"); });
});
afterEach(() => {
  mock.restoreAll();
  while (restorations.length) restorations.pop()();
  globalThis.fetch = originalFetch;
});

const produtos = {
  1: { id: 1, nome: "Máquina A", preco: 500, precoPromocional: null, estoque: 10, ativo: true },
  2: { id: 2, nome: "Micro-ondas B", preco: 399.99, precoPromocional: 299.99, estoque: 5, ativo: true },
  3: { id: 3, nome: "Peça C", preco: 99.99, precoPromocional: null, estoque: 100, ativo: true },
  4: { id: 4, nome: "Inativo D", preco: 10, precoPromocional: null, estoque: 3, ativo: false },
  5: { id: 5, nome: "Sem estoque E", preco: 10, precoPromocional: null, estoque: 0, ativo: true },
  6: { id: 6, nome: "Exato 799", preco: 799, precoPromocional: null, estoque: 3, ativo: true },
};
const stubProdutos = () => stub(prisma.produto, "findMany", async ({ where }) => where.id.in.map((id) => produtos[id]).filter(Boolean));

// ---------------------------------------------------------------- cotação (serviço)
test("cotação: subtotal abaixo de R$ 799 cobra R$ 50 e informa quanto falta para o frete grátis", async () => {
  stubProdutos();
  const r = await cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 3, quantidade: 2 }] });
  assert.equal(r.entregaDisponivel, true);
  assert.equal(r.subtotal, 199.98);
  assert.equal(r.frete, 50);
  assert.equal(r.total, 249.98);
  assert.equal(r.freteGratis, false);
  assert.equal(r.faltaParaFreteGratis, 599.03); // precisa passar de 799,00
  assert.equal(r.limiteFreteGratis, 799);
  assert.equal(r.municipio, "São Paulo (capital)");
});

test("cotação: subtotal exatamente R$ 799,00 ainda paga frete; acima disso é grátis", async () => {
  stubProdutos();
  const igual = await cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 6, quantidade: 1 }] });
  assert.equal(igual.subtotal, 799);
  assert.equal(igual.frete, 50);
  assert.equal(igual.total, 849);
  assert.equal(igual.freteGratis, false);
  const acima = await cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 6, quantidade: 1 }, { produtoId: 3, quantidade: 1 }] });
  assert.equal(acima.subtotal, 898.99);
  assert.equal(acima.frete, 0);
  assert.equal(acima.total, 898.99);
  assert.equal(acima.freteGratis, true);
  assert.equal(acima.faltaParaFreteGratis, 0);
});

test("cotação: vários produtos e preço promocional usam os preços do banco", async () => {
  stubProdutos();
  // 1 x 500 + 2 x 299,99 (promocional, não 399,99) = 1099,98
  const r = await cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 1, quantidade: 1 }, { produtoId: 2, quantidade: 2 }] });
  assert.equal(r.subtotal, 1099.98);
  assert.equal(r.frete, 0);
  assert.equal(r.freteGratis, true);
});

test("cotação: CEP fora da cobertura informa entrega indisponível (sem frete grátis, mesmo acima de R$ 799)", async () => {
  stubProdutos();
  const r = await cotarFrete({ cep: CEP_FORA, itens: [{ produtoId: 1, quantidade: 3 }] });
  assert.equal(r.entregaDisponivel, false);
  assert.equal(r.motivo, "ENTREGA_INDISPONIVEL");
  assert.equal(r.subtotal, 1500);
  assert.equal(r.frete, null);
  assert.equal(r.total, null);
  assert.equal(r.freteGratis, false);
  assert.match(r.mensagem, /Entrega indisponível/);
  assert.match(r.mensagem, /Osasco/);
});

test("cotação: produto inativo, sem estoque ou inexistente é recusado", async () => {
  stubProdutos();
  await assert.rejects(() => cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 4, quantidade: 1 }] }), { statusCode: 400, message: /inativo/ });
  await assert.rejects(() => cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 5, quantidade: 1 }] }), { statusCode: 400, message: /Estoque insuficiente/ });
  await assert.rejects(() => cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 3, quantidade: 101 }] }), { statusCode: 400, message: /Estoque insuficiente/ });
  await assert.rejects(() => cotarFrete({ cep: CEP_OK, itens: [{ produtoId: 999, quantidade: 1 }] }), { statusCode: 400, message: /inexistente/ });
});

// ---------------------------------------------------------------- endpoint /api/frete/cotacao
function dispatch(router, method, url, body = {}) {
  return new Promise((resolve, reject) => {
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; },
      setHeader() { return this; }, getHeader() { return undefined; },
      json(value) { this.body = value; resolve(this); return this; } };
    const req = { method, url, body, ip: "127.0.0.1", app: { get: () => false }, headers: {}, get: () => undefined };
    router.handle(req, res, (error) => (error ? reject(error) : resolve(res)));
  });
}

test("endpoint: cotação é pública, ignora preços enviados pelo cliente e usa o banco", async () => {
  stubProdutos();
  const res = await dispatch(freteRouter, "POST", "/cotacao", {
    cep: CEP_OK,
    itens: [{ produtoId: 3, quantidade: 1, precoUnitario: 0.01, preco: 0.01 }],
    subtotal: 0.01, frete: 0, total: 0.01,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.subtotal, 99.99);
  assert.equal(res.body.data.frete, 50);
  assert.equal(res.body.data.total, 149.99);
});

test("endpoint: CEP inválido e carrinho inválido retornam 400 sem consultar o banco", async () => {
  for (const body of [
    { cep: "123", itens: [{ produtoId: 3, quantidade: 1 }] },
    { cep: "abcde-fgh", itens: [{ produtoId: 3, quantidade: 1 }] },
    { itens: [{ produtoId: 3, quantidade: 1 }] },
    { cep: CEP_OK, itens: [] },
    { cep: CEP_OK, itens: [{ produtoId: 3, quantidade: 0 }] },
    { cep: CEP_OK },
  ]) {
    const res = await dispatch(freteRouter, "POST", "/cotacao", body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal(res.body.success, false);
  }
});

test("endpoint: schema aceita CEP com e sem hífen e descarta preços do cliente", () => {
  const ok = freteCotacaoSchema.parse({ cep: " 01310-100 ", itens: [{ produtoId: 1, quantidade: 1, precoUnitario: 1 }] });
  assert.equal(ok.cep, "01310-100");
  assert.deepEqual(ok.itens, [{ produtoId: 1, quantidade: 1 }]);
  assert.equal(freteCotacaoSchema.safeParse({ cep: "01310100", itens: [{ produtoId: 1, quantidade: 1 }] }).success, true);
});

// ---------------------------------------------------------------- criação do pedido
const MP_ENV = {
  MERCADO_PAGO_MODE: "test", MERCADO_PAGO_ACCESS_TOKEN: "fixture-only", MERCADO_PAGO_TEST_SELLER_ID: "777",
  FRONTEND_URL: "http://localhost:5173", MERCADO_PAGO_NOTIFICATION_URL: "",
  MERCADO_PAGO_SUCCESS_URL: "http://localhost:5173/pagamento/sucesso",
  MERCADO_PAGO_FAILURE_URL: "http://localhost:5173/checkout", MERCADO_PAGO_PENDING_URL: "http://localhost:5173/checkout/pendente",
};
async function comMercadoPago(fn) {
  const anterior = Object.fromEntries(Object.keys(MP_ENV).map((k) => [k, process.env[k]]));
  Object.assign(process.env, MP_ENV);
  try { return await fn(); } finally {
    for (const [k, v] of Object.entries(anterior)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}
function prepararCheckout() {
  const capturado = { pedido: null, preferencia: null, fetchCalls: 0 };
  stub(prisma.cliente, "findUnique", async () => customer);
  stub(prisma.pedido, "findFirst", async () => null);
  stubProdutos();
  stub(prisma, "$transaction", async (callback) => callback({
    pedido: {
      create: async ({ data }) => { capturado.pedido = { id: 1, ...data }; return capturado.pedido; },
      update: async ({ data }) => ({ ...capturado.pedido, ...data }),
    },
    $queryRaw: async () => [{ count: 1 }],
    checkoutAccessToken: { updateMany: async () => ({ count: 0 }), create: async () => ({ id: 1 }) },
  }));
  globalThis.fetch = async (url, options) => {
    capturado.fetchCalls += 1;
    if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 777, tags: ["test_user"] }) };
    capturado.preferencia = JSON.parse(options.body);
    return { ok: true, status: 201, json: async () => ({ id: "fixture-pref", init_point: "https://www.mercadopago.com.br/checkout/fixture" }) };
  };
  return capturado;
}
const somaMP = (body) => body.items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0);

test("pedido com pagamento: abaixo de R$ 799 grava frete de R$ 50 e envia linha de frete ao Mercado Pago", async () => {
  await comMercadoPago(async () => {
    const c = prepararCheckout();
    await orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, cep: CEP_OK, itens: [{ produtoId: 2, quantidade: 1 }, { produtoId: 3, quantidade: 1 }] });
    // 299,99 (promocional) + 99,99 = 399,98 + 50,00
    assert.equal(c.pedido.valorFrete, 50);
    assert.equal(c.pedido.valorTotal, 449.98);
    assert.equal(c.preferencia.items.length, 3);
    assert.deepEqual(c.preferencia.items[2], { id: "frete", title: "Frete", quantity: 1, unit_price: 50, currency_id: "BRL" });
    assert.equal(somaMP(c.preferencia), Math.round(c.pedido.valorTotal * 100)); // valor do pedido == valor no Mercado Pago
  });
});

test("pedido com pagamento: igual a R$ 799,00 ainda cobra frete", async () => {
  await comMercadoPago(async () => {
    const c = prepararCheckout();
    await orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, cep: CEP_OK, itens: [{ produtoId: 6, quantidade: 1 }] });
    assert.equal(c.pedido.valorFrete, 50);
    assert.equal(c.pedido.valorTotal, 849);
    assert.equal(somaMP(c.preferencia), 84900);
  });
});

test("pedido com pagamento: acima de R$ 799,00 tem frete grátis e não envia linha de frete", async () => {
  await comMercadoPago(async () => {
    const c = prepararCheckout();
    await orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, cep: "06000-000", itens: [{ produtoId: 1, quantidade: 2 }] });
    assert.equal(c.pedido.valorFrete, 0);
    assert.equal(c.pedido.valorTotal, 1000);
    assert.equal(c.preferencia.items.length, 1);
    assert.ok(!c.preferencia.items.some((i) => i.id === "frete"));
    assert.equal(somaMP(c.preferencia), 100000);
  });
});

test("pedido com pagamento: ignora total/frete/preço enviados pelo cliente", async () => {
  await comMercadoPago(async () => {
    const c = prepararCheckout();
    await orders.criarPedidoComPagamento({
      clienteAutenticadoId: 1, cep: CEP_OK, valorTotal: 1, valorFrete: 0, subtotal: 1,
      itens: [{ produtoId: 3, quantidade: 1, precoUnitario: 0.01 }],
    });
    assert.equal(c.pedido.valorFrete, 50);
    assert.equal(c.pedido.valorTotal, 149.99);
    assert.equal(c.preferencia.items[0].unit_price, 99.99);
  });
});

test("pedido: CEP fora da cobertura ou inválido é recusado antes de criar pedido ou chamar o Mercado Pago", async () => {
  await comMercadoPago(async () => {
    for (const cep of [CEP_FORA, "00000-000", "abc", undefined]) {
      const c = prepararCheckout();
      await assert.rejects(() => orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, cep, itens: [{ produtoId: 1, quantidade: 3 }] }), { statusCode: 400 }, String(cep));
      await assert.rejects(() => orders.criarPedido({ clienteAutenticadoId: 1, cep, itens: [{ produtoId: 1, quantidade: 3 }] }), { statusCode: 400 }, String(cep));
      assert.equal(c.pedido, null);
      assert.equal(c.fetchCalls, 0);
    }
  });
});

test("pedido: produto indisponível continua sendo recusado", async () => {
  await comMercadoPago(async () => {
    prepararCheckout();
    await assert.rejects(() => orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, cep: CEP_OK, itens: [{ produtoId: 4, quantidade: 1 }] }), { statusCode: 400, message: /inativo/ });
    await assert.rejects(() => orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, cep: CEP_OK, itens: [{ produtoId: 5, quantidade: 1 }] }), { statusCode: 400, message: /Estoque insuficiente/ });
  });
});

test("pedido sem pagamento (legado) também inclui frete no total", async () => {
  stub(prisma.cliente, "findUnique", async () => customer);
  stubProdutos();
  let salvo;
  stub(prisma, "$transaction", async (callback) => callback({
    pedido: { create: async ({ data }) => { salvo = data; return { id: 1, ...data }; } },
    $queryRaw: async () => [{ count: 1 }],
  }));
  await orders.criarPedido({ clienteAutenticadoId: 1, cep: CEP_OK, itens: [{ produtoId: 3, quantidade: 1 }] });
  assert.equal(salvo.valorFrete, 50);
  assert.equal(salvo.valorTotal, 149.99);
});

// ---------------------------------------------------------------- idempotência e consistência
test("idempotência: repetir a mesma chave retorna o pedido existente sem recalcular nem criar outro", async () => {
  await comMercadoPago(async () => {
    const { creationIdentity } = await import("../src/services/orderCreation.service.js");
    const dados = { clienteAutenticadoId: 1, cep: CEP_OK, creationKey: "frete-intent-0123456789", itens: [{ produtoId: 3, quantidade: 1 }] };
    const existente = { id: 55, status: "PENDENTE", paymentStatus: "PENDING", checkoutInitPoint: "https://mp.example/ck", paidAt: null,
      creationHash: creationIdentity(dados, true).hash, valorFrete: 50, valorTotal: 149.99 };
    stub(prisma.pedido, "findFirst", async () => existente);
    stub(prisma.pedido, "findUnique", async () => existente);
    stub(prisma.checkoutAccessToken, "updateMany", async () => ({ count: 0 }));
    stub(prisma.checkoutAccessToken, "create", async () => ({ id: 1 }));
    stub(prisma, "$transaction", async (callback) => callback({
      $queryRaw: async () => [{ id: 55 }], pedido: prisma.pedido, checkoutAccessToken: prisma.checkoutAccessToken,
    }));
    const r = await orders.criarPedidoComPagamento(dados);
    assert.equal(r.pedidoId, 55);
    assert.equal(r.init_point, "https://mp.example/ck");
  });
});

test("idempotência: mesma chave com outro CEP é conflito (409)", async () => {
  const { creationIdentity } = await import("../src/services/orderCreation.service.js");
  const original = { cep: CEP_OK, creationKey: "frete-intent-0123456789", itens: [{ produtoId: 3, quantidade: 1 }] };
  stub(prisma.pedido, "findFirst", async () => ({ id: 55, creationHash: creationIdentity(original, true).hash }));
  await assert.rejects(
    () => orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, ...original, cep: "02000-000" }),
    { statusCode: 409 },
  );
});

test("consistência: Mercado Pago recusa preferência cujo total diverge do valorTotal do pedido", async () => {
  await comMercadoPago(async () => {
    globalThis.fetch = async (url) => {
      if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 777, tags: ["test_user"] }) };
      throw new Error("Não deveria chamar a criação de preferência");
    };
    const itens = [{ produtoId: 3, nome: "Peça C", quantidade: 1, precoUnitario: 99.99 }];
    await assert.rejects(
      () => createMercadoPagoPreference({ pedido: { id: 1, valorTotal: 99.99 }, itens, valorFrete: 50, payer: customer }),
      { message: /divergente/ },
    );
    await assert.rejects(
      () => createMercadoPagoPreference({ pedido: { id: 1, valorTotal: 149.99 }, itens, valorFrete: 0, payer: customer }),
      { message: /divergente/ },
    );
  });
});

test("exigirFrete soma subtotal e frete em centavos", () => {
  const r = exigirFrete({ cep: CEP_OK, subtotal: 0.1 + 0.2 });
  assert.equal(r.valorFrete, 50);
  assert.equal(r.valorTotal, 50.3);
  assert.equal(exigirFrete({ cep: CEP_OK, subtotal: 799.01 }).valorTotal, 799.01);
  assert.throws(() => exigirFrete({ cep: CEP_FORA, subtotal: 100 }), { statusCode: 400, code: "ENTREGA_INDISPONIVEL" });
});

test("a rota de criação de pedido continua exigindo autenticação do cliente", async () => {
  stub(prisma.pedido, "create", async () => { throw new Error("Pedido não deveria ser criado sem autenticação"); });
  const res = await dispatch(orderRouter, "POST", "/com-pagamento", { cep: CEP_OK, itens: [{ produtoId: 3, quantidade: 1 }] });
  assert.equal(res.statusCode, 401);
});
