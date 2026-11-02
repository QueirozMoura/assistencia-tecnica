import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import prisma from "../src/config/prisma.js";

const allowedHost = "ep-summer-bar-b8esi79j.c-14.us-east-1.aws.neon.tech";
assert.equal(process.env.NODE_ENV, "development");
assert.equal(new URL(process.env.DATABASE_URL).hostname, allowedHost);
assert.equal(process.env.EMAIL_TRANSPORT, "mock");
assert.equal(process.env.TELEGRAM_TRANSPORT, "mock");
assert.equal(process.env.UPLOAD_DRIVER, "local");
if (process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN) {
  assert.equal(process.env.MERCADO_PAGO_MODE, "test");
  assert.match(process.env.MERCADO_PAGO_TEST_SELLER_ID || "", /^\d+$/);
}

const base = "http://127.0.0.1:3000";
async function request(path, { method = "GET", body, token, cookie, expected = 200 } = {}) {
  const response = await fetch(base + path, {
    method, headers: {
      Origin: "http://localhost:5173",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    }, body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(response.status, expected, `${method} ${path.split("?")[0]} status`);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const data = await response.json();
  console.log(`PASS ${method} ${path.split("?")[0]} HTTP ${expected}`);
  return { data, response };
}

try {
  const front = await fetch("http://127.0.0.1:5173/");
  assert.equal(front.status, 200);
  assert.match(await front.text(), /JFQ/);
  console.log("PASS frontend HTTP 200; API access through localhost CORS");
  await request("/api/health");
  await request("/api/auth/me", { expected: 401 });
  await request("/api/client-auth/me", { expected: 401 });
  await request("/api/client-auth/login", { method: "POST", body: {}, expected: 400 });
  await request("/api/client-auth/google", { method: "POST", body: {}, expected: 400 });
  const login = await request("/api/auth/login", { method: "POST", body: {
    email: process.env.DEV_ADMIN_EMAIL, senha: process.env.DEV_ADMIN_PASSWORD,
  }});
  const token = login.data.token;
  assert.ok(token);
  const cookie = login.response.headers.get("set-cookie").split(";")[0];
  await request("/api/auth/me", { token });
  await request("/api/auth/refresh", { method: "POST", cookie });

  const suffix = Date.now().toString();
  const category = await request("/api/categorias", { method: "POST", token, expected: 201,
    body: { nome: `Teste ficticio ${suffix}`, slug: `teste-${suffix}` } });
  const product = await request("/api/produtos", { method: "POST", token, expected: 201,
    body: { nome: `Produto ficticio ${suffix}`, slug: `produto-${suffix}`, preco: 42, estoque: 2, categoriaId: category.data.data.id } });
  await request(`/api/produtos/${product.data.data.id}`, { method: "PUT", token, body: { preco: 43 } });
  await request(`/api/produtos/${product.data.data.id}`);
  await request("/api/categorias");
  await request("/api/produtos");

  const email = `teste-${suffix}@example.invalid`;
  const password = randomBytes(18).toString("base64url");
  const registration = await request("/api/client-auth/register", { method: "POST", expected: 201,
    body: { nome: "Cliente ficticio local", email, telefone: "00000000000", senha: password, confirmarSenha: password } });
  const customerId = registration.data.cliente.id;
  const customer = await prisma.cliente.findUnique({ where: { id: customerId } });
  assert.equal(customer.email, email, "HTTP API and verified development database must match");
  assert.ok(customer.verifyTokenHash);
  const customerLogin = await request("/api/client-auth/login", { method: "POST", body: { email, senha: password } });
  await request("/api/client-auth/me", { token: customerLogin.data.token });
  await request("/api/client-auth/meus-pedidos", { token: customerLogin.data.token });
  await request("/api/client-auth/forgot-password", { method: "POST", body: { email } });

  // Only this freshly created synthetic customer's hashes are changed.
  const resetToken = randomBytes(32).toString("hex");
  const verifyToken = randomBytes(32).toString("hex");
  const hash = value => createHash("sha256").update(value).digest("hex");
  await prisma.cliente.update({ where: { id: customerId }, data: {
    resetTokenHash: hash(resetToken), resetTokenExpiry: new Date(Date.now() + 60000),
    verifyTokenHash: hash(verifyToken), verifyTokenExpiry: new Date(Date.now() + 60000),
  }});
  await request(`/api/client-auth/verify-email?token=${verifyToken}`);
  const newPassword = randomBytes(18).toString("base64url");
  await request("/api/client-auth/reset-password", { method: "POST", body: { token: resetToken, senha: newPassword, confirmarSenha: newPassword } });
  await request("/api/client-auth/login", { method: "POST", body: { email, senha: newPassword } });

  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=", "base64");
  const form = new FormData();
  form.set("imagem", new Blob([png], { type: "image/png" }), "synthetic.png");
  const upload = await fetch(base + "/api/upload/produto", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  assert.equal(upload.status, 201);
  const uploaded = await upload.json();
  const imageUrl = new URL(uploaded.data.url);
  assert.equal(imageUrl.hostname, "localhost");
  assert.match(imageUrl.pathname, /^\/uploads\/dev\//);
  const image = await fetch(base + imageUrl.pathname);
  assert.equal(image.status, 200);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  console.log("PASS local image upload and retrieval; no Cloudinary request");
  await request("/api/auth/logout", { method: "POST", cookie });
  console.log("PASS authentication, synthetic create/read/update, mock email, CORS and isolated DB; no payment requests");
} catch (error) {
  // Avoid displaying response bodies, tokens, database errors or credentials.
  console.error("FAIL local smoke:", error.code === "ERR_ASSERTION" ? error.message : error.name);
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
