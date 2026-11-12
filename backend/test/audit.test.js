import test, { beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

// Never use the project's database credentials or external transports in this suite.
Object.assign(process.env, {
  NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture",
  DEV_DATABASE_HOST: "127.0.0.1", JWT_SECRET: "synthetic-admin-key", JWT_CLIENT_SECRET: "synthetic-client-key",
  EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock", GOOGLE_CLIENT_ID: "synthetic-client.apps.googleusercontent.com",
});
const prisma = (await import("../src/config/prisma.js")).default;
const client = await import("../src/services/clientAuth.service.js");
const auth = await import("../src/services/auth.service.js");
const refreshTokens = await import("../src/services/refreshToken.service.js");
const adminController = await import("../src/controllers/auth.controller.js");
const orderController = await import("../src/controllers/pedido.controller.js");
const orders = await import("../src/services/pedido.service.js");
const bookings = await import("../src/services/agendamento.service.js");
const products = await import("../src/services/produto.service.js");
const categories = await import("../src/services/categoria.service.js");
const { clientAuthMiddleware } = await import("../src/middlewares/clientAuth.middleware.js");
const { authMiddleware } = await import("../src/middlewares/auth.middleware.js");
const { adminMiddleware } = await import("../src/middlewares/admin.middleware.js");
const { tecnicoMiddleware } = await import("../src/middlewares/tecnico.middleware.js");
const { errorMiddleware } = await import("../src/middlewares/error.middleware.js");
const { validate } = await import("../src/middlewares/validation.middleware.js");
const { agendamentoSchema, agendamentoUpdateSchema } = await import("../src/validators/agendamento.validator.js");
const { produtoQuerySchema } = await import("../src/validators/produto.validator.js");
const { clientRegisterSchema, resetPasswordSchema } = await import("../src/validators/clientAuth.validator.js");
const orderRouter = (await import("../src/routes/pedido.routes.js")).default;
const bookingRouter = (await import("../src/routes/agendamento.routes.js")).default;
const { buscarPedidoSucessoPorToken } = orders;
const hash = value => createHash("sha256").update(value).digest("hex");
const fixturePassword = "synthetic-password-only";
const passwordHash = await bcrypt.hash(fixturePassword, 4);
const customer = { id: 1, nome: "Cliente fictício", email: "audit@example.invalid", senha: passwordHash, googleId: null };
const originalFetch = globalThis.fetch;
const restorations = [];
function stub(target, method, implementation) {
  const previous = target[method];
  const calls = [];
  const replacement = function (...args) {
    calls.push({ arguments: args });
    return implementation.apply(this, args);
  };
  replacement.mock = { calls };
  target[method] = replacement;
  restorations.push(() => { target[method] = previous; });
  return replacement;
}

beforeEach(() => {
  globalThis.fetch = () => { throw new Error("External network forbidden in audit tests"); };
  // Unexpected ORM use fails locally, before any connection can be opened.
  for (const model of ["cliente", "usuario", "refreshToken", "checkoutAccessToken", "pedido", "produto", "agendamento", "categoria", "estoqueMovimento"]) {
    for (const method of ["findUnique", "findFirst", "findMany", "create", "update", "updateMany", "count"]) {
      stub(prisma[model], method, () => { throw new Error(`Unexpected ORM call: ${model}.${method}`); });
    }
  }
  stub(prisma, "$transaction", () => { throw new Error("Unexpected transaction"); });
});
afterEach(() => {
  mock.restoreAll();
  while (restorations.length) restorations.pop()();
  globalThis.fetch = originalFetch;
});

function response() {
  return { statusCode: 200, body: null, cookies: {}, status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }, cookie(k,v,opts) { this.cookies[k] = { value: v, opts }; }, clearCookie(k) { this.cookies[k] = null; } };
}
async function middleware(fn, req = {}) {
  const res = response(); let passed = false; let error;
  await fn(req, res, e => { if (e) error = e; else passed = true; });
  return { res, passed, error };
}
function dispatch(router, method, url, body = {}, token) {
  return new Promise((resolve, reject) => {
    const res = response();
    res.setHeader = () => res;
    res.getHeader = () => undefined;
    res.json = function (value) { this.body = value; resolve(this); return this; };
    const req = { method, url, body, ip: "127.0.0.1", app: { get: () => false }, headers: token ? { authorization: `Bearer ${token}` } : {}, get: () => undefined };
    router.handle(req, res, error => error ? reject(error) : resolve(res));
  });
}
const bearer = token => ({ headers: { authorization: `Bearer ${token}` }, get: () => undefined });

test("customer registration hashes password and verification token and never returns secrets", async () => {
  stub(prisma.cliente, "findUnique", async () => null);
  let saved;
  stub(prisma.cliente, "create", async ({ data }) => { saved = data; return { id: 1, ...data }; });
  const result = await client.register({ nome: customer.nome, email: " AUDIT@EXAMPLE.INVALID ", telefone: "00000000000", senha: fixturePassword });
  assert.equal(saved.email, customer.email);
  assert.equal(await bcrypt.compare(fixturePassword, saved.senha), true);
  assert.match(saved.verifyTokenHash, /^[a-f0-9]{64}$/);
  for (const key of ["senha", "verifyTokenHash", "verifyTokenExpiry", "resetTokenHash"]) assert.equal(result.cliente[key], undefined);
  assert.equal(jwt.verify(result.token, process.env.JWT_CLIENT_SECRET).type, "client");
});
test("duplicate customer registration is refused before writing", async () => {
  stub(prisma.cliente, "findUnique", async () => customer);
  await assert.rejects(() => client.register({ email: customer.email }), { statusCode: 409 });
});
test("password login authenticates normalized email and rejects wrong password", async () => {
  stub(prisma.cliente, "findUnique", async ({ where }) => { assert.equal(where.email, customer.email); return customer; });
  assert.equal((await client.login(" AUDIT@EXAMPLE.INVALID ", fixturePassword)).cliente.senha, undefined);
  await assert.rejects(() => client.login(customer.email, "wrong"), { statusCode: 401 });
});
test("nonexistent and Google-only accounts reject password login equally", async () => {
  for (const fixture of [null, { ...customer, senha: null }]) {
    stub(prisma.cliente, "findUnique", async () => fixture);
    await assert.rejects(() => client.login(customer.email, fixturePassword), { statusCode: 401 });
  }
});
test("registration and reset schemas reject mismatched passwords", () => {
  assert.equal(clientRegisterSchema.safeParse({ nome: "Teste", email: customer.email, telefone: "00000000000", senha: "123456", confirmarSenha: "654321" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: "fixture", senha: "123456", confirmarSenha: "654321" }).success, false);
});
test("registration trims names and email before validation and rejects blank names", () => {
  const fixture = { nome: "  Cliente  ", email: " AUDIT@EXAMPLE.INVALID ", telefone: "00000000000", senha: "123456", confirmarSenha: "123456" };
  assert.equal(clientRegisterSchema.parse(fixture).email, customer.email);
  assert.equal(clientRegisterSchema.safeParse({ ...fixture, nome: "   " }).success, false);
});
test("admin login validates password, excludes its hash and sets an httpOnly refresh cookie", async () => {
  stub(prisma.usuario, "findUnique", async () => ({ ...customer, ativo: true, role: "ADMIN" }));
  const create = stub(prisma.refreshToken, "create", async () => ({}));
  const result = await middleware(adminController.login, { body: { email: customer.email, senha: fixturePassword } });
  assert.equal(result.res.statusCode, 200);
  assert.equal(result.res.body.usuario.senha, undefined);
  assert.equal(result.res.cookies.refreshToken.opts.httpOnly, true);
  assert.equal(result.res.cookies.refreshToken.opts.sameSite, "lax");
  assert.equal(result.res.body.refreshToken, undefined);
  assert.equal(create.mock.calls.length, 1);
  await assert.rejects(() => auth.login(customer.email, "wrong"), { statusCode: 401 });
});

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
function googleToken(overrides = {}, signingKey = keys.privateKey) {
  return jwt.sign({ sub: "fixture-google-user", email: customer.email, email_verified: true, ...overrides }, signingKey,
    { algorithm: "RS256", keyid: "fixture-key", issuer: "https://accounts.google.com", audience: process.env.GOOGLE_CLIENT_ID, expiresIn: "10m" });
}
function localGoogleCertificates() {
  mock.method(OAuth2Client.prototype, "getFederatedSignonCertsAsync", async () => ({ certs: { "fixture-key": keys.publicKey.export({ type: "spki", format: "pem" }) } }));
}
test("Google ID token is cryptographically verified with local RSA fixture and creates a customer", async () => {
  localGoogleCertificates();
  stub(prisma.cliente, "findFirst", async () => null);
  const create = stub(prisma.cliente, "create", async ({ data }) => ({ id: 1, ...data }));
  const result = await client.googleAuth({ idToken: googleToken() });
  assert.equal(result.cliente.emailVerificado, true);
  assert.equal(create.mock.calls[0].arguments[0].data.googleId, "fixture-google-user");
});
test("Google login links a matching verified email without changing a password", async () => {
  localGoogleCertificates();
  stub(prisma.cliente, "findFirst", async () => customer);
  const update = stub(prisma.cliente, "update", async ({ data }) => ({ ...customer, ...data }));
  await client.googleAuth({ idToken: googleToken() });
  assert.deepEqual(update.mock.calls[0].arguments[0].data, { googleId: "fixture-google-user", emailVerificado: true });
});
for (const [name, claims] of [["wrong audience", { aud: "other-client" }], ["expired", { exp: 1 }], ["unverified email", { email_verified: false }]]) {
  test(`Google rejects ${name} before any database operation`, async () => {
    localGoogleCertificates();
    const now = Math.floor(Date.now() / 1000);
    const idToken = jwt.sign({ sub: "fixture", email: customer.email, email_verified: true, aud: process.env.GOOGLE_CLIENT_ID, iss: "https://accounts.google.com", iat: now, exp: now + 600, ...claims }, keys.privateKey, { algorithm: "RS256", keyid: "fixture-key" });
    await assert.rejects(() => client.googleAuth({ idToken }), { statusCode: 401 });
  });
}
test("Google rejects a tampered RSA signature", async () => {
  localGoogleCertificates();
  const other = generateKeyPairSync("rsa", { modulusLength: 2048 });
  await assert.rejects(() => client.googleAuth({ idToken: googleToken({}, other.privateKey) }), { statusCode: 401 });
});
test("Google rejects a conflicting linked identity", async () => {
  localGoogleCertificates();
  stub(prisma.cliente, "findFirst", async () => ({ ...customer, googleId: "different-subject" }));
  await assert.rejects(() => client.googleAuth({ idToken: googleToken() }), { statusCode: 401 });
});

test("forgot password stores a hash and returns the same response for absent accounts", async () => {
  stub(prisma.cliente, "findUnique", async () => customer);
  const update = stub(prisma.cliente, "update", async () => customer);
  const known = await client.forgotPassword(customer.email);
  assert.match(update.mock.calls[0].arguments[0].data.resetTokenHash, /^[a-f0-9]{64}$/);
  stub(prisma.cliente, "findUnique", async () => null);
  assert.deepEqual(await client.forgotPassword("absent@example.invalid"), known);
});
test("reset password hashes the new password and consumes its token", async () => {
  const token = "synthetic-reset-token";
  let consumed = false;
  stub(prisma.cliente, "findFirst", async ({ where }) => {
    assert.equal(where.resetTokenHash, hash(token));
    assert.ok(where.resetTokenExpiry.gt instanceof Date);
    return consumed ? null : customer;
  });
  const update = stub(prisma.cliente, "updateMany", async ({ where }) => {
    assert.equal(where.id, customer.id);
    assert.equal(where.resetTokenHash, hash(token));
    assert.ok(where.resetTokenExpiry.gt instanceof Date);
    consumed = true; return { count: 1 };
  });
  await client.resetPassword(token, "new-synthetic-password");
  const { data } = update.mock.calls[0].arguments[0];
  assert.equal(await bcrypt.compare("new-synthetic-password", data.senha), true);
  assert.equal(data.resetTokenHash, null);
  assert.equal(data.resetTokenExpiry, null);
  await assert.rejects(() => client.resetPassword(token, "another-password"), { statusCode: 400 });
});
test("expired recovery/verification tokens cannot update a customer", async () => {
  stub(prisma.cliente, "findFirst", async () => null);
  await assert.rejects(() => client.resetPassword("expired", "new-password"), { statusCode: 400 });
  await assert.rejects(() => client.verifyEmail("expired"), { statusCode: 400 });
});
test("verification consumes its hash and sets verified status", async () => {
  stub(prisma.cliente, "findFirst", async ({ where }) => { assert.equal(where.verifyTokenHash, hash("fixture")); return customer; });
  const update = stub(prisma.cliente, "update", async () => customer);
  await client.verifyEmail("fixture");
  assert.deepEqual(update.mock.calls[0].arguments[0].data, { emailVerificado: true, verifyTokenHash: null, verifyTokenExpiry: null });
});
test("create-password cannot overwrite an existing password", async () => {
  stub(prisma.cliente, "findUnique", async () => customer);
  await assert.rejects(() => client.createPassword(1, "new-password"), { statusCode: 409 });
});
test("Google-only customers can create their first password without returning the hash", async () => {
  stub(prisma.cliente, "findUnique", async () => ({ ...customer, senha: null }));
  const update = stub(prisma.cliente, "updateMany", async ({ where }) => {
    assert.deepEqual(where, { id: 1, senha: null });
    return { count: 1 };
  });
  const result = await client.createPassword(1, "synthetic-first-password");
  assert.equal(await bcrypt.compare("synthetic-first-password", update.mock.calls[0].arguments[0].data.senha), true);
  assert.equal(result.senha, undefined);
});
test("a concurrent first-password request cannot replace a password set after its initial read", async () => {
  stub(prisma.cliente, "findUnique", async () => ({ ...customer, senha: null }));
  stub(prisma.cliente, "updateMany", async ({ where }) => {
    assert.deepEqual(where, { id: 1, senha: null });
    return { count: 0 };
  });
  await assert.rejects(() => client.createPassword(1, "fixture-password"), { statusCode: 409 });
});
test("a concurrently consumed recovery token cannot reset the password again", async () => {
  stub(prisma.cliente, "findFirst", async () => customer);
  stub(prisma.cliente, "updateMany", async ({ where }) => {
    assert.equal(where.resetTokenHash, hash("fixture-token"));
    assert.ok(where.resetTokenExpiry.gt instanceof Date);
    return { count: 0 };
  });
  await assert.rejects(() => client.resetPassword("fixture-token", "fixture-password"), { statusCode: 400 });
});

test("refresh tokens are random, hashed at rest and carry an expiration", async () => {
  const create = stub(prisma.refreshToken, "create", async () => ({}));
  const token = await refreshTokens.createRefreshToken(1);
  assert.equal(create.mock.calls[0].arguments[0].data.tokenHash, hash(token.token));
  assert.ok(token.expiresAt > new Date());
});
for (const [name, record, reason] of [
  ["missing", null, "TOKEN_NOT_FOUND"],
  ["expired", { expiresAt: new Date(0) }, "TOKEN_EXPIRED"],
  ["revoked", { revokedAt: new Date() }, "TOKEN_REVOKED"],
]) test(`refresh rejects ${name} sessions`, async () => {
  stub(prisma.refreshToken, "findUnique", async () => record);
  assert.equal((await refreshTokens.validateRefreshToken("a".repeat(64))).reason, reason);
});
test("admin refresh issues a JWT for an active session and logout revokes that refresh token", async () => {
  let revokedAt = null;
  const token = "a".repeat(64);
  stub(prisma.refreshToken, "findUnique", async () => ({ id: 1, usuarioId: 1, revokedAt, expiresAt: new Date(Date.now() + 60000), usuario: { id: 1, ativo: true, role: "ADMIN" } }));
  stub(prisma.refreshToken, "updateMany", async ({ where }) => { assert.equal(where.tokenHash, hash(token)); revokedAt = new Date(); return { count: 1 }; });
  const first = await middleware(adminController.refresh, { cookies: { refreshToken: token } });
  assert.equal(jwt.verify(first.res.body.token, process.env.JWT_SECRET).id, 1);
  const logout = await middleware(adminController.logout, { cookies: { refreshToken: token } });
  assert.equal(logout.res.statusCode, 200);
  assert.equal(logout.res.cookies.refreshToken, null);
  assert.equal((await middleware(adminController.refresh, { cookies: { refreshToken: token } })).res.statusCode, 401);
});
test("inactive admin cannot refresh or login", async () => {
  stub(prisma.refreshToken, "findUnique", async () => ({ expiresAt: new Date(Date.now() + 60000), usuario: { ativo: false } }));
  assert.equal((await middleware(adminController.refresh, { cookies: { refreshToken: "a".repeat(64) } })).res.statusCode, 403);
  stub(prisma.usuario, "findUnique", async () => ({ ativo: false }));
  await assert.rejects(() => auth.login("admin@example.invalid", fixturePassword), { statusCode: 403 });
});
test("client and admin JWTs cannot cross permission domains", async () => {
  const clientJwt = jwt.sign({ id: 1, type: "client" }, process.env.JWT_CLIENT_SECRET);
  const adminJwt = jwt.sign({ id: 1, role: "ADMIN" }, process.env.JWT_SECRET);
  assert.equal((await middleware(clientAuthMiddleware, bearer(adminJwt))).res.statusCode, 401);
  assert.equal((await middleware(authMiddleware, bearer(clientJwt))).error.name, "JsonWebTokenError");
  assert.equal((await middleware(clientAuthMiddleware, bearer(jwt.sign({ type: "client" }, process.env.JWT_CLIENT_SECRET)))).res.statusCode, 401);
});
test("private middleware rejects absent/expired credentials and accepts verified customers", async () => {
  assert.equal((await middleware(clientAuthMiddleware, bearer(""))).res.statusCode, 401);
  assert.equal((await middleware(authMiddleware, { headers: {} })).res.statusCode, 401);
  const token = jwt.sign({ id: 1, type: "client" }, process.env.JWT_CLIENT_SECRET, { expiresIn: -1 });
  assert.equal((await middleware(clientAuthMiddleware, bearer(token))).res.statusCode, 401);
  stub(prisma.cliente, "findUnique", async () => customer);
  assert.equal((await middleware(clientAuthMiddleware, bearer(jwt.sign({ id: 1, type: "client" }, process.env.JWT_CLIENT_SECRET)))).passed, true);
});
test("technicians can access bookings but cannot perform admin-only actions", async () => {
  assert.equal((await middleware(tecnicoMiddleware, { usuario: { role: "TECNICO" } })).passed, true);
  assert.equal((await middleware(adminMiddleware, { usuario: { role: "TECNICO" } })).res.statusCode, 403);
  assert.equal((await middleware(adminMiddleware, { usuario: { role: "ADMIN" } })).passed, true);
});

test("order creation and ID return routes authenticate before invoking controllers", () => {
  for (const path of ["/", "/com-pagamento", "/sucesso/:pedidoId"]) {
    const route = orderRouter.stack.find(layer => layer.route?.path === path && (path === "/sucesso/:pedidoId" ? layer.route.methods.get : layer.route.methods.post)).route;
    const chain = route.stack.map(layer => layer.handle);
    assert.ok(chain.includes(clientAuthMiddleware));
    assert.ok(chain.indexOf(clientAuthMiddleware) < chain.length - 1);
  }
});
test("anonymous order routes return 401 without reaching the database", async () => {
  for (const [method, path] of [["POST", "/"], ["POST", "/com-pagamento"], ["GET", "/sucesso/1"]]) {
    assert.equal((await dispatch(orderRouter, method, path)).statusCode, 401);
  }
});
test("order services cannot trust a client ID supplied without authentication", async () => {
  for (const fn of [orders.criarPedido, orders.criarPedidoComPagamento]) await assert.rejects(() => fn({ clienteId: 99, itens: [{ produtoId: 1, quantidade: 1 }] }), { statusCode: 401 });
});
for (const [name, itens] of [["empty", []], ["negative", [{ produtoId: 1, quantidade: -1 }]],
  ["fractional", [{ produtoId: 1, quantidade: 1.5 }]], ["duplicate", [{ produtoId: 1, quantidade: 1 }, { produtoId: 1, quantidade: 1 }]]]) {
  test(`order services reject ${name} items before database access`, async () => {
    for (const fn of [orders.criarPedido, orders.criarPedidoComPagamento]) await assert.rejects(() => fn({ clienteAutenticadoId: 1, itens }), { statusCode: 400 });
  });
}
test("order return checks ownership and cannot read another customer's order", async () => {
  stub(prisma.pedido, "findFirst", async ({ where }) => { assert.deepEqual(where, { id: 2, clienteId: 1 }); return null; });
  const result = await middleware(orderController.buscarPedidoSucessoPorId, { params: { pedidoId: "2" }, cliente: { id: 1 } });
  assert.equal(result.error.statusCode, 404);
});
test("order total ignores client price/total and conditionally reserves stock in its transaction", async () => {
  stub(prisma.cliente, "findUnique", async ({ where }) => { assert.equal(where.id, 1); return customer; });
  stub(prisma.produto, "findMany", async () => [{ id: 1, preco: 20, precoPromocional: 10.1, estoque: 4, ativo: true }]);
  let saved;
  stub(prisma, "$transaction", async callback => callback({
    pedido: { create: async ({ data }) => { saved = data; return { id: 1, ...data }; } },
    $queryRaw: async (sql, id, source) => { assert.equal(id, 1); assert.equal(source, "CRIACAO_LEGADO"); return [{ count: 1 }]; },
  }));
  await orders.criarPedido({ clienteId: 99, clienteAutenticadoId: 1, cep: "01310-100", itens: [{ produtoId: 1, quantidade: 3, precoUnitario: 0.01 }], valorTotal: 0.03, valorFrete: 0 });
  assert.equal(saved.clienteId, 1);
  // Subtotal 3 x 10,10 = 30,30 (abaixo de R$ 799) + frete fixo de R$ 50,00; frete e total enviados pelo cliente são ignorados.
  assert.equal(saved.valorFrete, 50);
  assert.equal(saved.valorTotal, 80.3);
  assert.equal(saved.itens.create[0].precoUnitario, 10.1);
});
test("Mercado Pago checkout uses authenticated identity and server prices in the provider preference", async () => {
  const overrides = {
    MERCADO_PAGO_MODE: "test", MERCADO_PAGO_ACCESS_TOKEN: "fixture-only", MERCADO_PAGO_TEST_SELLER_ID: "777",
    FRONTEND_URL: "http://localhost:5173", MERCADO_PAGO_NOTIFICATION_URL: "",
    MERCADO_PAGO_SUCCESS_URL: "http://localhost:5173/pagamento/sucesso",
    MERCADO_PAGO_FAILURE_URL: "http://localhost:5173/checkout", MERCADO_PAGO_PENDING_URL: "http://localhost:5173/checkout/pendente",
  };
  const previous = Object.fromEntries(Object.keys(overrides).map(key => [key, process.env[key]]));
  Object.assign(process.env, overrides);
  try {
    stub(prisma.cliente, "findUnique", async ({ where }) => { assert.equal(where.id, 1); return customer; });
    stub(prisma.produto, "findMany", async () => [{ id: 1, nome: "Fictício", preco: 20, precoPromocional: 10.1, estoque: 4, ativo: true }]);
    let saved;
    stub(prisma, "$transaction", async callback => callback({
      pedido: {
        create: async ({ data }) => { saved = { id: 1, ...data }; return saved; },
        update: async ({ data }) => ({ ...saved, ...data }),
      },
      $queryRaw: async (sql, id, source) => { assert.equal(id, 1); assert.equal(source, "CRIACAO_MERCADO_PAGO"); return [{ count: 1 }]; },
      checkoutAccessToken: { updateMany: async () => ({ count: 0 }), create: async () => ({ id: 1 }) },
    }));
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push(url);
      if (url === "https://api.mercadopago.com/users/me") return { ok: true, json: async () => ({ id: 777, tags: ["test_user"] }) };
      assert.equal(url, "https://api.mercadopago.com/checkout/preferences");
      const body = JSON.parse(options.body);
      assert.equal(body.items[0].unit_price, 10.1);
      assert.equal(body.items[0].quantity, 3);
      assert.deepEqual(body.items[1], { id: "frete", title: "Frete", quantity: 1, unit_price: 50, currency_id: "BRL" });
      const somaMercadoPago = body.items.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0);
      assert.equal(somaMercadoPago, 8030); // idêntico ao valorTotal do pedido (R$ 80,30)
      assert.equal(body.payer.email, customer.email);
      return { ok: true, status: 201, json: async () => ({ id: "fixture-preference", init_point: "https://www.mercadopago.com.br/checkout/fixture" }) };
    };
    const result = await orders.criarPedidoComPagamento({ clienteId: 999, clienteAutenticadoId: 1, cep: "01310-100", valorTotal: 0.03, valorFrete: 0, itens: [{ produtoId: 1, quantidade: 3, precoUnitario: 0.01 }] });
    assert.equal(saved.clienteId, 1);
    assert.equal(saved.valorFrete, 50);
    assert.equal(saved.valorTotal, 80.3);
    assert.equal(saved.paymentStatus, "PENDING");
    assert.equal(result.pedidoId, 1);
    assert.equal(calls.length, 2);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
for (const [name, product] of [["inactive", { id: 1, ativo: false, estoque: 4 }], ["unavailable", { id: 1, ativo: true, estoque: 0 }]]) {
  test(`Mercado Pago checkout rejects ${name} products before preference creation`, async () => {
    stub(prisma.cliente, "findUnique", async () => customer);
    stub(prisma.produto, "findMany", async () => [product]);
    await assert.rejects(() => orders.criarPedidoComPagamento({ clienteAutenticadoId: 1, itens: [{ produtoId: 1, quantidade: 1 }] }), { statusCode: 400 });
  });
}
for (const [name, fixtures] of [["missing product", []], ["insufficient stock", [{ id: 1, estoque: 0 }]]]) {
  test(`checkout rejects ${name} before payment/network calls`, async () => {
    stub(prisma.cliente, "findUnique", async () => customer);
    stub(prisma.produto, "findMany", async () => fixtures);
    await assert.rejects(() => orders.criarPedido({ clienteAutenticadoId: 1, itens: [{ produtoId: 1, quantidade: 1 }] }), { statusCode: 400 });
  });
}
test("concurrent stock loss aborts the legacy order transaction", async () => {
  stub(prisma.cliente, "findUnique", async () => customer);
  stub(prisma.produto, "findMany", async () => [{ id: 1, estoque: 1, ativo: true, preco: 1 }]);
  stub(prisma, "$transaction", async callback => callback({ pedido: { create: async () => ({}) },  $queryRaw: async () => { throw new Error("JFQ_STOCK_INSUFFICIENT"); } }));
  await assert.rejects(() => orders.criarPedido({ clienteAutenticadoId: 1, itens: [{ produtoId: 1, quantidade: 1 }] }), { statusCode: 400 });
});
for (const [name, count, preferenceId, expected] of [["first legacy cancellation", 1, null, 1], ["repeated cancellation", 0, null, 0], ["repeated checkout cancellation", 0, "fixture-preference", 0]]) {
  test(`inventory return: ${name}`, async () => {
    const order = { id: 1, status: count ? "PENDENTE" : "CANCELADO", preferenceId, itens: [{ produtoId: 1, quantidade: 1 }] };
    stub(prisma.pedido, "findUnique", async () => order);
    let increments = 0;
    stub(prisma, "$transaction", async callback => callback({
      pedido: { findUnique: async () => order, updateMany: async ({ where, data }) => { assert.equal(where.status, "PENDENTE"); order.status = data.status; return { count }; } },
      $queryRaw: async () => { increments++; return [{ count: 1 }]; },
    }));
    await orders.atualizarStatusPedido(1, "CANCELADO");
    assert.equal(increments, expected);
  });
}
test("checkout status token remains readable for polling without being consumed", async () => {
  stub(prisma.checkoutAccessToken, "findUnique", async () => ({ id: 1, expiresAt: new Date(Date.now() + 60000), pedido: { id: 1, status: "PENDENTE", paymentStatus: "PENDING", itens: [] } }));
  for (let i = 0; i < 2; i++) assert.equal((await buscarPedidoSucessoPorToken("a".repeat(64))).paymentStatus, "PENDING");
});
test("public product filtering parses false correctly and allows the zero price bound", () => {
  const query = produtoQuerySchema.parse({ ativo: "false", destaque: "false", precoMin: "0" });
  assert.equal(query.ativo, false); assert.equal(query.destaque, false); assert.equal(query.precoMin, 0);
  assert.equal(produtoQuerySchema.safeParse({ ativo: "garbage" }).success, false);
});
test("product listing applies filters and missing product details return 404", async () => {
  stub(prisma.produto, "count", async () => 1);
  stub(prisma.produto, "findMany", async ({ where }) => { assert.equal(where.ativo, true); return [{ id: 1 }]; });
  assert.equal((await products.listarProdutos({})).meta.total, 1);
  stub(prisma.produto, "findUnique", async () => null);
  await assert.rejects(() => products.buscarProdutoPorId(999), { statusCode: 404 });
  await assert.rejects(() => products.buscarProdutoPorSlug("absent"), { statusCode: 404 });
});
test("category listing applies active filter and missing categories return 404", async () => {
  stub(prisma.categoria, "findMany", async ({ where }) => { assert.deepEqual(where, { ativo: true }); return [{ id: 1, nome: "Fictícia" }]; });
  assert.equal((await categories.listarCategorias({ ativo: true }))[0].id, 1);
  stub(prisma.categoria, "findUnique", async () => null);
  await assert.rejects(() => categories.buscarCategoriaPorId(999), { statusCode: 404 });
});

const booking = { nomeContato: "Cliente fictício", whatsapp: "11999999999", equipamento: "Lavadora", problema: "Equipamento não liga", cep: "", email: "" };
test("booking accepts blank optional fields and rejects whitespace/invalid data", () => {
  assert.equal(agendamentoSchema.safeParse(booking).success, true);
  for (const override of [{ nomeContato: "   " }, { problema: "          " }, { equipamento: "  " }, { whatsapp: "invalid" }, { cep: "abc" }, { status: "CONCLUIDO" }, { clienteId: 999 }]) {
    assert.equal(agendamentoSchema.safeParse({ ...booking, ...override }).success, false);
  }
  assert.deepEqual(agendamentoUpdateSchema.parse({ marca: "Teste" }), { marca: "Teste" });
});
test("booking persistence associates the authenticated client and supports guest requests", async () => {
  const create = stub(prisma.agendamento, "create", async ({ data }) => ({ id: 1, ...data }));
  const result = await bookings.criarAgendamento({ ...booking, clienteAutenticadoId: 1 });
  assert.equal(result.clienteId, 1);
  assert.equal(create.mock.calls[0].arguments[0].data.clienteAutenticadoId, undefined);
  assert.equal((await bookings.criarAgendamento(booking)).clienteId, undefined);
  assert.equal((await bookings.criarAgendamento({ ...booking, clienteId: 999 })).clienteId, undefined);
});
test("guest booking route validates, persists and returns a successful response in process", async () => {
  stub(prisma.agendamento, "create", async ({ data }) => ({ id: 1, status: "PENDENTE", ...data }));
  const result = await dispatch(bookingRouter, "POST", "/", booking);
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.success, true);
  assert.equal((await dispatch(bookingRouter, "POST", "/", { ...booking, whatsapp: "invalid" })).statusCode, 400);
});
test("booking administration requires staff authentication", async () => {
  assert.equal((await dispatch(bookingRouter, "GET", "/")).statusCode, 401);
  assert.equal((await dispatch(bookingRouter, "PATCH", "/1/status", { status: "CONFIRMADO" })).statusCode, 401);
});
test("booking status rejects invalid transitions and accepts confirmation", async () => {
  stub(prisma.agendamento, "findUnique", async () => ({ id: 1, status: "PENDENTE" }));
  stub(prisma.agendamento, "update", async ({ data }) => data);
  await assert.rejects(() => bookings.atualizarStatusAgendamento(1, "CONCLUIDO"), { statusCode: 400 });
  assert.equal((await bookings.atualizarStatusAgendamento(1, "CONFIRMADO")).status, "CONFIRMADO");
});
test("client booking history scopes its query to the authenticated customer", async () => {
  stub(prisma.agendamento, "findMany", async ({ where }) => { assert.deepEqual(where, { clienteId: 1 }); return []; });
  assert.deepEqual(await bookings.listarMeusAgendamentos(1), []);
});
test("Zod query errors return 400 through the error middleware instead of crashing", () => {
  const parsed = produtoQuerySchema.safeParse({ page: "-1" });
  const res = response(); errorMiddleware(parsed.error, { originalUrl: "/api/produtos?page=-1" }, res, () => {});
  assert.equal(res.statusCode, 400); assert.equal(res.body.errors[0].campo, "page");
});
test("invalid booking body returns 400 and does not invoke persistence", async () => {
  const result = await middleware(validate(agendamentoSchema), { body: { ...booking, whatsapp: "invalid" } });
  assert.equal(result.res.statusCode, 400); assert.equal(result.passed, false);
});

test("legacy retry with the same intent returns persisted order without reading stock or debiting again", async () => {
  const data = { clienteAutenticadoId: 1, creationKey: "fixture-intent-legacy", itens: [{ produtoId: 1, quantidade: 1 }] };
  const { creationIdentity } = await import("../src/services/orderCreation.service.js");
  const order = { id: 77, creationHash: creationIdentity(data, false).hash };
  stub(prisma.pedido, "findFirst", async ({ where }) => { assert.equal(where.clienteId, 1); return order; });
  assert.equal(await orders.criarPedido(data), order);
});
test("creation key cannot be reused after changing item quantities", async () => {
  stub(prisma.pedido, "findFirst", async () => ({ id: 77, creationHash: "different-intent" }));
  await assert.rejects(() => orders.criarPedido({ clienteAutenticadoId: 1, creationKey: "fixture-intent-legacy", itens: [{ produtoId: 1, quantidade: 1 }] }), { statusCode: 409 });
});
test("new order writes explicit ledger version and intent identity before its single debit", async () => {
  const data = { clienteAutenticadoId: 1, cep: "01310-100", creationKey: "fixture-intent-legacy", itens: [{ produtoId: 1, quantidade: 1 }] };
  stub(prisma.pedido, "findFirst", async () => null);
  stub(prisma.cliente, "findUnique", async () => customer);
  stub(prisma.produto, "findMany", async () => [{ id: 1, ativo: true, estoque: 1, preco: 5 }]);
  const calls = [];
  stub(prisma, "$transaction", async callback => callback({
    $queryRaw: async (sql, first, second) => { calls.push(sql.join('').includes('pg_advisory_xact_lock') ? 'lock' : 'reserve'); assert.ok(first); assert.ok(second); return [{ count: 1 }]; },
    pedido: { findFirst: async () => { calls.push('lookup'); return null; }, create: async ({ data: saved }) => {
      calls.push('create'); assert.equal(saved.stockLedgerVersion, 1); assert.equal(saved.creationKey, data.creationKey); assert.equal(saved.creationHash.length, 64); return { id: 1, ...saved };
    } },
  }));
  await orders.criarPedido(data);
  assert.deepEqual(calls, ['lock', 'lookup', 'create', 'reserve']);
});
test("concurrent intent retry rechecks under lock before creating order", async () => {
  stub(prisma.pedido, "findFirst", async () => null);
  stub(prisma.cliente, "findUnique", async () => customer);
  // A previous in-flight identical request may already have consumed all availability.
  stub(prisma.produto, "findMany", async () => [{ id: 1, ativo: true, estoque: 0, preco: 5 }]);
  const request = { clienteAutenticadoId: 1, cep: "01310-100", creationKey: "fixture-intent-legacy", itens: [{ produtoId: 1, quantidade: 1 }] };
  const { creationIdentity } = await import("../src/services/orderCreation.service.js");
  const order = { id: 77, creationHash: creationIdentity(request, false).hash };
  stub(prisma, "$transaction", async callback => callback({ $queryRaw: async () => [{ locked: 1 }], pedido: { findFirst: async () => order } }));
  assert.equal(await orders.criarPedido({ clienteAutenticadoId: 1, cep: "01310-100", creationKey: "fixture-intent-legacy", itens: [{ produtoId: 1, quantidade: 1 }] }), order);
});
test("orders with persistent stock evidence cannot be deleted via admin service", async () => {
  stub(prisma.pedido, "findUnique", async () => ({ id: 1, status: 'CANCELADO', itens: [] }));
  stub(prisma.estoqueMovimento, "count", async () => 2);
  await assert.rejects(() => orders.deletarPedido(1), { statusCode: 409 });
});
test("pending orders must be cancelled before deletion is considered", async () => {
  stub(prisma.pedido, "findUnique", async () => ({ id: 1, status: 'PENDENTE', itens: [] }));
  await assert.rejects(() => orders.deletarPedido(1), { statusCode: 409 });
});
