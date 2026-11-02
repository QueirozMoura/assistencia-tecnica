import test from 'node:test';
import assert from 'node:assert/strict';
Object.assign(process.env, { NODE_ENV: 'development', DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/fixture', DEV_DATABASE_HOST: '127.0.0.1' });
const { creationIdentity, creationFields, findCreation, lockCreation, replayCheckout } = await import('../src/services/orderCreation.service.js');
import { reserveOrderStock, releaseOrderStock } from '../src/services/stockLedger.service.js';
import { splitSql } from './stock-postgres.cases.js';
const data = { creationKey: 'fixture-intent-0001', clienteAutenticadoId: 1, itens: [{ produtoId: 2, quantidade: 1 }, { produtoId: 1, quantidade: 2 }], rua: 'Fixture street' };
const identity = creationIdentity(data, true);
test('request identity is stable across item ordering and untrusted price changes', () => {
  assert.deepEqual(creationIdentity({ ...data, valorTotal: 0, itens: [...data.itens].reverse().map(i => ({ ...i, precoUnitario: 0 })) }, true), identity);
  assert.deepEqual(creationFields(identity), { creationKey: identity.key, creationHash: identity.hash });
});
test('identity distinguishes checkout kinds, quantities and address', () => {
  assert.notEqual(creationIdentity(data, false).hash, identity.hash);
  assert.notEqual(creationIdentity({ ...data, rua: 'Other fixture' }, true).hash, identity.hash);
  assert.notEqual(creationIdentity({ ...data, itens: [{ produtoId: 1, quantidade: 3 }] }, true).hash, identity.hash);
});
for (const key of ['', 'short', 'x'.repeat(129), 'invalid key contains spaces', 42]) {
  test(`invalid request key shape is rejected (${typeof key}:${String(key).length})`, () => {
    assert.throws(() => creationIdentity({ ...data, creationKey: key }, true), { statusCode: 400 });
  });
}
test('legacy callers without intent key are explicitly not deduplicated', async () => {
  assert.equal(creationIdentity({ ...data, creationKey: undefined }, false), null);
  assert.deepEqual(creationFields(null), {});
  assert.equal(await findCreation({}, 1, null), null);
  await lockCreation({}, 1, null);
});
test('lookup binds intent key to authenticated customer', async () => {
  const order = { id: 1, creationHash: identity.hash };
  assert.equal(await findCreation({ pedido: { findFirst: async ({ where }) => { assert.deepEqual(where, { clienteId: 1, creationKey: identity.key }); return order; } } }, 1, identity), order);
});
test('same key with changed intent returns conflict', async () => {
  await assert.rejects(() => findCreation({ pedido: { findFirst: async () => ({ creationHash: 'different' }) } }, 1, identity), { statusCode: 409 });
});
test('request lock is parameterized and customer scoped', async () => {
  await lockCreation({ $queryRaw: async (sql, customerId, key) => { assert.equal(customerId, 1); assert.equal(key, identity.key); assert.ok(sql.join('').includes('pg_advisory_xact_lock')); } }, 1, identity);
});
test('reserve SQL is the shared database operation with explicit source', async () => {
  for (const payment of [false, true]) assert.equal(await reserveOrderStock({ $queryRaw: async (sql, id, source) => {
    assert.equal(id, 7); assert.equal(source, payment ? 'CRIACAO_MERCADO_PAGO' : 'CRIACAO_LEGADO');
    assert.ok(sql.join('').includes('jfq_reserve_order_stock')); return [{ count: 2 }];
  } }, 7, payment), 2);
});
test('historical release without evidence returns zero without inventing writes', async () => {
  assert.equal(await releaseOrderStock({ $queryRaw: async (sql, id, source) => {
    assert.equal(id, 7); assert.equal(source, 'ADMIN_CANCELAMENTO'); assert.ok(sql.join('').includes('jfq_release_order_stock')); return [{ count: 0 }];
  } }, 7, 'ADMIN_CANCELAMENTO'), 0);
});
test('database insufficient stock becomes a safe 400 response', async () => {
  await assert.rejects(() => reserveOrderStock({ $queryRaw: async () => { throw { code: 'P2010', meta: { message: 'JFQ_STOCK_INSUFFICIENT' } }; } }, 1), { statusCode: 400, message: 'Estoque insuficiente. Atualize o carrinho.' });
});
test('database invariant failure becomes conflict; unrelated errors remain errors', async () => {
  await assert.rejects(() => releaseOrderStock({ $queryRaw: async () => { throw new Error('JFQ_STOCK_RETURN_WITHOUT_MATCHING_DEBIT'); } }, 1, 'ADMIN_CANCELAMENTO'), { statusCode: 409 });
  const failure = new Error('synthetic network failure');
  await assert.rejects(() => reserveOrderStock({ $queryRaw: async () => { throw failure; } }, 1), error => error === failure);
});
test('checkout replay locks and rereads state instead of trusting stale pending order', async () => {
  let locked = false;
  const tx = { $queryRaw: async () => { locked = true; return [{ id: 1 }]; }, pedido: { findUnique: async () => { assert.ok(locked); return { id: 1, status: 'CANCELADO' }; } } };
  await assert.rejects(() => replayCheckout(tx, { id: 1, status: 'PENDENTE' }), { statusCode: 409 });
});
test('checkout replay uses saved preference without provider call or another reservation', async () => {
  const calls = [];
  const order = { id: 1, status: 'PENDENTE', paymentStatus: 'PENDING', checkoutInitPoint: 'https://example.invalid/fixture' };
  const tx = { $queryRaw: async () => [{ id: 1 }], pedido: { findUnique: async () => order },
    checkoutAccessToken: { updateMany: async () => { calls.push('revoke'); return { count: 0 }; }, create: async () => { calls.push('create'); return { id: 1 }; } } };
  const result = await replayCheckout(tx, order);
  assert.equal(result.pedidoId, 1); assert.equal(result.init_point, order.checkoutInitPoint); assert.ok(result.checkoutAccessToken);
  assert.deepEqual(calls, ['revoke', 'create']);
});
test('SQL fixture splitter preserves dollar blocks, comments and literal semicolons', () => {
  assert.equal(splitSql("BEGIN; -- ;comment\nSELECT 'a;b'; DO $$ BEGIN PERFORM 1; END $$; COMMIT;").length, 2);
});
