// SQL integration cases shared by the psql runner and the connected Neon rehearsal.
// No fixtures are personal, and no existing schema or row is overwritten/deleted.
export function splitSql(sql) {
  const statements = []; let start = 0, quoted = false, dollar = false, comment = false;
  for (let i = 0; i < sql.length; i++) {
    if (comment) { if (sql[i] === '\n') comment = false; continue; }
    if (!quoted && !dollar && sql.slice(i, i + 2) === '--') { comment = true; i++; continue; }
    if (!quoted && sql.slice(i, i + 2) === '$$') { dollar = !dollar; i++; continue; }
    if (!dollar && sql[i] === "'") {
      if (quoted && sql[i + 1] === "'") { i++; continue; }
      quoted = !quoted;
    }
    if (!quoted && !dollar && sql[i] === ';') { statements.push(sql.slice(start, i).trim()); start = i + 1; }
  }
  if (sql.slice(start).trim()) statements.push(sql.slice(start).trim());
  return statements.filter(s => s && !/^(BEGIN|COMMIT)$/i.test(s));
}
export const assertSql = expression => `DO $$ BEGIN IF NOT (${expression}) THEN RAISE EXCEPTION 'JFQ_TEST_ASSERTION_FAILED'; END IF; END $$`;
const order = (id, items = [[1, 2]], version = 1) => [
  `INSERT INTO pedidos(id,"clienteId","valorTotal","updatedAt","stockLedgerVersion") VALUES (${id},1,10,now(),${version ?? 'NULL'})`,
  ...items.map(([product, quantity], i) => `INSERT INTO itens_pedido(id,"pedidoId","produtoId",quantidade,"precoUnitario") VALUES (${id * 10 + i},${id},${product},${quantity},5)`),
];
const reserve = id => `SELECT jfq_reserve_order_stock(${id},'CRIACAO_MERCADO_PAGO')`;
const cancel = id => [`UPDATE pedidos SET status='CANCELADO' WHERE id=${id}`, `SELECT jfq_release_order_stock(${id},'ADMIN_CANCELAMENTO')`];
export function stockPostgresSuite(schema, baseline, migration) {
  if (!/^jfq_stock_[a-z0-9_]+$/.test(schema)) throw new Error('Isolated schema required');
  const scope = `SET LOCAL search_path TO "${schema}", public`;
  const fixture = [
    `INSERT INTO categorias(id,nome,slug,"updatedAt") VALUES (1,'Fixture ledger','fixture-ledger',now())`,
    `INSERT INTO clientes(id,nome,telefone,"updatedAt") VALUES (1,'Fixture ledger','00000000000',now())`,
    ...[[1,10],[2,1],[3,0],[10,1],[11,5],[12,5],[13,5],[20,2],[21,2147483647]].map(([id, stock]) => `INSERT INTO produtos(id,nome,slug,preco,estoque,"categoriaId","updatedAt") VALUES (${id},'Fixture ${id}','fixture-${id}',5,${stock},1,now())`),
    `INSERT INTO pedidos(id,"clienteId","valorTotal","updatedAt") VALUES (900,1,10,now())`,
    `INSERT INTO itens_pedido(id,"pedidoId","produtoId",quantidade,"precoUnitario") VALUES (9000,900,1,1,5)`,
  ];
  const steps = [];
  const add = (name, statements, expectedError = null, verify = []) => steps.push({ name, statements: [scope, ...statements], expectedError, verify: verify.length ? [scope, ...verify] : [] });
  add('create pending order reserves stock without marking payment paid', [...order(1), reserve(1), assertSql(`(SELECT estoque=8 FROM produtos WHERE id=1) AND (SELECT status='PENDENTE' AND "paidAt" IS NULL FROM pedidos WHERE id=1) AND (SELECT count(*)=1 FROM estoque_movimentos WHERE "pedidoId"=1)`)]);
  add('repeated debit function is idempotent', [reserve(1), assertSql(`(SELECT estoque=8 FROM produtos WHERE id=1) AND (SELECT count(*)=1 FROM estoque_movimentos WHERE "pedidoId"=1)`)]);
  add('cancel releases exactly original debit', [...cancel(1), assertSql(`(SELECT estoque=10 FROM produtos WHERE id=1) AND (SELECT count(*)=1 FROM estoque_movimentos r JOIN estoque_movimentos d ON r."debitoOrigemId"=d.id WHERE r."pedidoId"=1 AND r.quantidade=d.quantidade)`)]);
  add('repeated cancellation return is idempotent', [...cancel(1), assertSql(`(SELECT estoque=10 FROM produtos WHERE id=1) AND (SELECT count(*)=2 FROM estoque_movimentos WHERE "pedidoId"=1)`)]);
  add('cancelled order cannot reopen', [`UPDATE pedidos SET status='PENDENTE' WHERE id=1`], 'JFQ_STOCK_CANCELLED_ORDER_FINAL');
  add('historical data preserved with unknown version', [assertSql(`(SELECT "stockLedgerVersion" IS NULL FROM pedidos WHERE id=900)`)]);
  add('historical cancellation does not return unproven inventory', [...cancel(900), assertSql(`(SELECT estoque=10 FROM produtos WHERE id=1) AND NOT EXISTS(SELECT 1 FROM estoque_movimentos WHERE "pedidoId"=900)`)]);
  add('historical debit cannot be invented', [reserve(900)], 'JFQ_STOCK_DEBIT_NOT_ALLOWED');
  add('create proof and persist it between transactions', [...order(3), reserve(3)]);
  add('persisted original proof supports later return', [...cancel(3), assertSql(`(SELECT estoque=10 FROM produtos WHERE id=1)`)]);
  add('insufficient second product rolls back first debit and entire order', [...order(4, [[2,1],[3,1]]), reserve(4)], 'JFQ_STOCK_INSUFFICIENT', [assertSql(`NOT EXISTS(SELECT 1 FROM pedidos WHERE id=4) AND (SELECT estoque=1 FROM produtos WHERE id=2) AND NOT EXISTS(SELECT 1 FROM estoque_movimentos WHERE "pedidoId"=4)`)]);
  add('failure after debit rolls back order and ledger', [...order(5), reserve(5), `DO $$ BEGIN RAISE EXCEPTION 'JFQ_FORCED_FAILURE'; END $$`], 'JFQ_FORCED_FAILURE', [assertSql(`NOT EXISTS(SELECT 1 FROM pedidos WHERE id=5) AND (SELECT estoque=10 FROM produtos WHERE id=1)`)]);
  add('prepare return rollback fixture', [...order(6), reserve(6)]);
  add('failure after return rolls back state stock and compensation', [...cancel(6), `DO $$ BEGIN RAISE EXCEPTION 'JFQ_FORCED_FAILURE'; END $$`], 'JFQ_FORCED_FAILURE', [assertSql(`(SELECT status='PENDENTE' FROM pedidos WHERE id=6) AND (SELECT estoque=8 FROM produtos WHERE id=1) AND NOT EXISTS(SELECT 1 FROM estoque_movimentos WHERE "pedidoId"=6 AND tipo='DEVOLUCAO')`)]);
  add('missing debit helper is rejected at commit', [...order(7)], 'JFQ_STOCK_INCOMPLETE_DEBIT', [assertSql(`NOT EXISTS(SELECT 1 FROM pedidos WHERE id=7)`)]);
  add('missing release helper is rejected at commit', [`UPDATE pedidos SET status='CANCELADO' WHERE id=6`], 'JFQ_STOCK_INCOMPLETE_RETURN', [assertSql(`(SELECT status='PENDENTE' FROM pedidos WHERE id=6)`)]);
  for (const [id, quantity] of [[8,0],[9,-1]]) add(`invalid quantity ${quantity} rejected atomically`, [...order(id, [[1, quantity]]), reserve(id)], 'estoque_movimentos_shape_check', [assertSql(`NOT EXISTS(SELECT 1 FROM pedidos WHERE id=${id}) AND (SELECT estoque=8 FROM produtos WHERE id=1)`)]);
  add('ledger cannot be edited', [`UPDATE estoque_movimentos SET quantidade=3 WHERE "pedidoId"=6`], 'JFQ_STOCK_HISTORY_IMMUTABLE');
  add('debited item cannot be edited', [`UPDATE itens_pedido SET quantidade=3 WHERE "pedidoId"=6`], 'JFQ_STOCK_ITEM_IMMUTABLE');
  add('ledger version cannot be disabled', [`UPDATE pedidos SET "stockLedgerVersion"=NULL WHERE id=6`], 'JFQ_STOCK_VERSION_IMMUTABLE');
  add('original debit cannot be compensated twice through another item', [`UPDATE pedidos SET status='CANCELADO' WHERE id=6`, `INSERT INTO estoque_movimentos("pedidoId","itemId","produtoId",tipo,quantidade,origem,"debitoOrigemId") SELECT 6,60,1,'DEVOLUCAO',2,'ADMIN_CANCELAMENTO',id FROM estoque_movimentos WHERE "pedidoId"=3 AND tipo='DEBITO'`], 'estoque_movimentos_debitoOrigemId_key');
  add('excess return rejected', [`UPDATE pedidos SET status='CANCELADO' WHERE id=6`, `INSERT INTO estoque_movimentos("pedidoId","itemId","produtoId",tipo,quantidade,origem,"debitoOrigemId") SELECT 6,60,1,'DEVOLUCAO',3,'ADMIN_CANCELAMENTO',id FROM estoque_movimentos WHERE "pedidoId"=6 AND tipo='DEBITO'`], 'JFQ_STOCK_ITEM_MISMATCH');
  add('cross item return with unused debit is rejected', [...order(21, [[11,1]]), reserve(21)]);
  add('return identity must match original debit item product and order', [`UPDATE pedidos SET status='CANCELADO' WHERE id=6`, `INSERT INTO estoque_movimentos("pedidoId","itemId","produtoId",tipo,quantidade,origem,"debitoOrigemId") SELECT 6,60,1,'DEVOLUCAO',2,'ADMIN_CANCELAMENTO',id FROM estoque_movimentos WHERE "pedidoId"=21 AND tipo='DEBITO'`], 'JFQ_STOCK_RETURN_WITHOUT_MATCHING_DEBIT');
  add('inactive product can receive its proven reserve back', [`UPDATE produtos SET ativo=false WHERE id=11`, ...cancel(21), `UPDATE produtos SET ativo=true WHERE id=11`, assertSql(`(SELECT estoque=5 FROM produtos WHERE id=11)`)]);
  add('new request key uniqueness is scoped per customer', [`UPDATE pedidos SET "creationKey"='fixture-key-00001',"creationHash"='fixture-hash' WHERE id=6`]);
  add('same customer request key cannot create another order', [...order(12), `UPDATE pedidos SET "creationKey"='fixture-key-00001' WHERE id=12`, reserve(12)], 'pedidos_clienteId_creationKey_key');
  add('prepare partial return failure', [...order(20, [[20,1],[21,1]]), reserve(20), `UPDATE produtos SET estoque=2147483647 WHERE id=21`]);
  add('failure on second return rolls back first return', [...cancel(20)], 'integer out of range', [assertSql(`(SELECT status='PENDENTE' FROM pedidos WHERE id=20) AND (SELECT estoque=1 FROM produtos WHERE id=20) AND NOT EXISTS(SELECT 1 FROM estoque_movimentos WHERE "pedidoId"=20 AND tipo='DEVOLUCAO')`)]);
  add('prepare same order concurrent cancellation', [...order(30, [[11,2]]), reserve(30)]);
  add('legacy creation uses the same atomic debit operation', [...order(60, [[1,1]]), `SELECT jfq_reserve_order_stock(60,'CRIACAO_LEGADO')`, assertSql(`(SELECT estoque=7 FROM produtos WHERE id=1) AND EXISTS(SELECT 1 FROM estoque_movimentos WHERE "pedidoId"=60 AND origem='CRIACAO_LEGADO')`)]);
  add('legacy cancellation returns its persisted debit', [...cancel(60), assertSql(`(SELECT estoque=8 FROM produtos WHERE id=1)`)]);

  // SQL equivalents of the CAS paths; these are NOT substitutes for live REST tests.
  for (const [id, product] of [[70,12],[71,13]]) add(`prepare admin-webhook contention ${id}`, [
    ...order(id, [[product,2]]), reserve(id), `UPDATE pedidos SET "paymentStatus"='PENDING' WHERE id=${id}`,
  ]);
  const adminCancel = id => `DO $$ BEGIN
    UPDATE pedidos SET status='CANCELADO' WHERE id=${id} AND status='PENDENTE';
    IF FOUND THEN PERFORM jfq_release_order_stock(${id},'ADMIN_CANCELAMENTO');
    ELSIF (SELECT status FROM pedidos WHERE id=${id}) <> 'CANCELADO' THEN
      RAISE EXCEPTION 'JFQ_TEST_ADMIN_CAS_CONFLICT';
    END IF;
  END $$`;
  const webhookReject = id => `DO $$ BEGIN
    INSERT INTO mercado_pago_webhook_events("notificationId","paymentId","rawPayloadHash",processed,"updatedAt")
      VALUES ('fixture-race-${id}','fixture-payment-${id}','fixture-payload-hash',false,now());
    UPDATE pedidos SET status='CANCELADO',"paymentStatus"='FAILED'
      WHERE id=${id} AND status='PENDENTE' AND "paymentStatus"='PENDING';
    IF NOT FOUND THEN RAISE EXCEPTION 'JFQ_TEST_WEBHOOK_CAS_CONFLICT'; END IF;
    PERFORM jfq_release_order_stock(${id},'WEBHOOK_CANCELAMENTO');
    UPDATE mercado_pago_webhook_events SET processed=true,"processedAt"=now() WHERE "notificationId"='fixture-race-${id}';
  END $$`;
  const suite = {
    schema,
    // Existing public fixtures are untouched; baseline is created exclusively in a new schema.
    baseline: [`CREATE SCHEMA "${schema}"`, scope, ...splitSql(baseline).filter(s => !s.includes('CREATE SCHEMA')), ...fixture],
    migration: [scope, ...splitSql(migration.replaceAll('"public".', `"${schema}".`))],
    steps,
    races: [
      { name: 'two independent transactions competing for one available unit',
        a: [scope, ...order(40, [[10,1]]), reserve(40), 'SELECT pg_sleep(1)'],
        b: [scope, ...order(41, [[10,1]]), reserve(41)], errors: ['JFQ_STOCK_INSUFFICIENT'],
        verify: [scope, assertSql(`(SELECT estoque=0 FROM produtos WHERE id=10) AND (SELECT count(*)=1 FROM pedidos WHERE id IN (40,41)) AND (SELECT count(*)=1 FROM estoque_movimentos WHERE "produtoId"=10)`)] },
      { name: 'two independent cancellations of same order return only once',
        a: [scope, ...cancel(30), 'SELECT pg_sleep(1)'], b: [scope, ...cancel(30)], errors: [],
        verify: [scope, assertSql(`(SELECT estoque=5 FROM produtos WHERE id=11) AND (SELECT count(*)=1 FROM estoque_movimentos WHERE "pedidoId"=30 AND tipo='DEVOLUCAO')`)] },
      { name: 'advisory lock serializes repeated creation intent on independent connections',
        a: [scope, `DO $$ BEGIN
          PERFORM pg_advisory_xact_lock(1,hashtext('fixture-concurrent-intent'));
          IF NOT EXISTS(SELECT 1 FROM pedidos WHERE "clienteId"=1 AND "creationKey"='fixture-concurrent-intent') THEN
            INSERT INTO pedidos(id,"clienteId","valorTotal","updatedAt","stockLedgerVersion","creationKey") VALUES(50,1,5,now(),1,'fixture-concurrent-intent');
            INSERT INTO itens_pedido(id,"pedidoId","produtoId",quantidade,"precoUnitario") VALUES(500,50,11,1,5);
            PERFORM jfq_reserve_order_stock(50,'CRIACAO_MERCADO_PAGO');
          END IF;
          PERFORM pg_sleep(1);
        END $$`],
        b: [], errors: [],
        verify: [scope, assertSql(`(SELECT count(*)=1 FROM pedidos WHERE "creationKey"='fixture-concurrent-intent') AND (SELECT estoque=4 FROM produtos WHERE id=11)`)] },
      { name: 'admin cancellation holds row while rejected webhook attempts CAS',
        a: [scope, adminCancel(70)], b: [scope, webhookReject(70)], errors: ['JFQ_TEST_WEBHOOK_CAS_CONFLICT'],
        verify: [scope, assertSql(`(SELECT estoque=5 FROM produtos WHERE id=12) AND (SELECT count(*)=1 FROM estoque_movimentos WHERE "pedidoId"=70 AND tipo='DEVOLUCAO') AND (SELECT status='CANCELADO' AND "paymentStatus"='PENDING' FROM pedidos WHERE id=70) AND NOT EXISTS(SELECT 1 FROM mercado_pago_webhook_events WHERE "notificationId"='fixture-race-70')`)] },
      { name: 'rejected webhook holds row while administrative cancellation retries',
        a: [scope, webhookReject(71)], b: [scope, adminCancel(71)], errors: [],
        verify: [scope, assertSql(`(SELECT estoque=5 FROM produtos WHERE id=13) AND (SELECT count(*)=1 FROM estoque_movimentos WHERE "pedidoId"=71 AND tipo='DEVOLUCAO') AND (SELECT status='CANCELADO' AND "paymentStatus"='FAILED' FROM pedidos WHERE id=71) AND EXISTS(SELECT 1 FROM mercado_pago_webhook_events WHERE "notificationId"='fixture-race-71' AND processed)`)] },
    ],
    final: [scope, assertSql(`NOT EXISTS (SELECT 1 FROM produtos WHERE estoque<0) AND NOT EXISTS (SELECT 1 FROM estoque_movimentos r LEFT JOIN estoque_movimentos d ON r."debitoOrigemId"=d.id WHERE r.tipo='DEVOLUCAO' AND (d.id IS NULL OR d.quantidade<>r.quantidade OR d."itemId"<>r."itemId"))`)],
  };
  suite.races[2].b = [...suite.races[2].a];
  for (const race of suite.races) {
    for (const statements of [race.a, race.b]) {
      statements.splice(1, 0, 'SELECT pg_backend_pid() AS backend_pid, transaction_timestamp() AS began');
      statements.push('SELECT clock_timestamp() AS ended');
    }
  }
  return suite;
}
