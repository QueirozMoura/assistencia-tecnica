import test from "node:test";
import assert from "node:assert/strict";

Object.assign(process.env, { NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture", DEV_DATABASE_HOST: "127.0.0.1" });
const prisma = (await import("../src/config/prisma.js")).default;
const { getDashboardStats } = await import("../src/services/dashboard.service.js");

function stub(pedidoGroups) {
  let revenueWhere;
  const count = async () => 1;
  Object.assign(prisma.produto, { count });
  Object.assign(prisma.categoria, { count });
  Object.assign(prisma.cliente, { count });
  Object.assign(prisma.agendamento, { count, groupBy: async () => [] });
  Object.assign(prisma.pedido, {
    count, groupBy: async () => pedidoGroups,
    aggregate: async ({ where }) => { revenueWhere = where; return { _sum: { valorTotal: 125.5, valorFrete: 50 } }; },
  });
  return () => revenueWhere;
}

test("dashboard counts PREPARANDO orders and includes them in revenue (they are already paid)", async () => {
  const revenueWhere = stub([{ status: "PREPARANDO", _count: { status: 3 } }, { status: "PAGO", _count: { status: 1 } }, { status: "CANCELADO", _count: { status: 2 } }]);
  const stats = await getDashboardStats();
  assert.deepEqual(stats.pedidos.porStatus, { PENDENTE: 0, PAGO: 1, PREPARANDO: 3, ENVIADO: 0, ENTREGUE: 0, CANCELADO: 2 });
  assert.deepEqual(revenueWhere().status.in.sort(), ["ENTREGUE", "ENVIADO", "PAGO", "PREPARANDO"]);
  assert.equal(stats.pedidos.receitaTotal, 125.5);
});
test("dashboard revenue never includes pending or cancelled orders", async () => {
  const revenueWhere = stub([]);
  await getDashboardStats();
  for (const status of ["PENDENTE", "CANCELADO"]) assert.ok(!revenueWhere().status.in.includes(status));
});
test("dashboard separa receita de produtos e de frete sem alterar receitaTotal", async () => {
  stub([]);
  const { pedidos } = await getDashboardStats();
  assert.equal(pedidos.receitaTotal, 125.5); // soma de valorTotal, como antes
  assert.equal(pedidos.receitaFrete, 50);
  assert.equal(pedidos.receitaProdutos, 75.5);
  assert.equal(pedidos.receitaProdutos + pedidos.receitaFrete, pedidos.receitaTotal);
});
