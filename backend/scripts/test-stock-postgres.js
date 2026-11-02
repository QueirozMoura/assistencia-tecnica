// Opt-in. Never loads .env. Uses only the confirmed, isolated direct endpoint.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import { createConnection } from 'node:net';
import { stockPostgresSuite } from '../test/stock-postgres.cases.js';
import { assertLockWitness, lockWitnessSql, raceWork, rehearsalRounds } from '../test/stock-concurrency.js';
const host = 'ep-divine-rice-bcxmkisc.c-16.us-east-1.aws.neon.tech';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const frame = event => `SELECT json_build_object('event','${event}','pid',pg_backend_pid(),'at',clock_timestamp())`;
function jsonRows(stdout) { return stdout.split('\n').filter(line => line.trim().startsWith('{')).map(line => JSON.parse(line)); }
async function preflight() {
  try { await lookup(host); }
  catch (error) { return { ready: false, stage: 'dns', code: error.code || 'DNS_FAILED', databaseWrites: false }; }
  return new Promise(resolve => {
    const socket = createConnection({ host, port: 5432 });
    const finish = result => { socket.destroy(); resolve({ ...result, databaseWrites: false }); };
    socket.setTimeout(4000, () => finish({ ready: false, stage: 'tcp', code: 'TIMEOUT' }));
    socket.once('error', error => finish({ ready: false, stage: 'tcp', code: error.code || 'TCP_FAILED' }));
    socket.once('connect', () => finish({ ready: true, stage: 'tcp', authenticated: false }));
  });
}
function session(environment) {
  const child = spawn('psql', ['-X', '-q', '-t', '-A', '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=terse'],
    { env: environment, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', pending = '', settled = false;
  const frames = [], waiters = new Set();
  let resolveClosed;
  const closed = new Promise(resolve => { resolveClosed = resolve; });
  const watchdog = setTimeout(() => child.kill('SIGTERM'), 30000);
  function finish(code) {
    if (settled) return;
    settled = true; clearTimeout(watchdog);
    for (const waiter of waiters) waiter.reject(new Error('Test PostgreSQL session closed before evidence was received.'));
    waiters.clear(); resolveClosed({ ok: code === 0, stdout, stderr, frames });
  }
  child.on('error', () => finish(-1));
  child.on('close', finish);
  child.stdin.on('error', () => {}); // ON_ERROR_STOP can close stdin before the coordinator sends COMMIT.
  child.stderr.on('data', data => { stderr += data; });
  child.stdout.on('data', data => {
    stdout += data; pending += data;
    const lines = pending.split('\n'); pending = lines.pop();
    for (const line of lines) {
      if (!line.trim().startsWith('{')) continue;
      let value;
      try { value = JSON.parse(line); } catch { continue; }
      frames.push(value);
      for (const waiter of waiters) if (waiter.event === value.event) { waiters.delete(waiter); waiter.resolve(value); }
    }
  });
  function send(statements) {
    if (settled || child.stdin.destroyed) return;
    child.stdin.write(`${statements.join(';\n')};\n`);
  }
  return {
    closed, send,
    async waitFor(event) {
      const prior = frames.find(value => value.event === event);
      if (prior) return prior;
      if (settled) throw new Error('Test PostgreSQL session already closed.');
      let waiter, timeout;
      try {
        return await new Promise((resolve, reject) => {
          waiter = { event, resolve, reject }; waiters.add(waiter);
          timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), 15000);
        });
      } finally { clearTimeout(timeout); waiters.delete(waiter); }
    },
    async commit() {
      if (!settled && !child.stdin.destroyed) child.stdin.end('COMMIT;\n\\q\n');
      return closed;
    },
    async abort() {
      // Only this runner's own psql child is terminated; its uncommitted test transaction rolls back.
      if (!settled) child.kill('SIGTERM');
      return closed;
    },
  };
}
async function main() {
  if (process.argv.includes('--preflight')) {
    const result = await preflight(); console.log(JSON.stringify(result));
    process.exitCode = result.ready ? 0 : 2; return;
  }
  let url;
  try { url = new URL(process.env.JFQ_STOCK_TEST_URL); } catch { throw new Error('Provide JFQ_STOCK_TEST_URL for the isolated rehearsal endpoint.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== host || url.pathname !== '/neondb' || url.port && url.port !== '5432') {
    throw new Error('Refused: only the known isolated direct endpoint and database are permitted.');
  }
  const rounds = rehearsalRounds(process.env.JFQ_STOCK_TEST_ROUNDS);
  const availability = await preflight();
  if (!availability.ready) { console.log(JSON.stringify({ blocked: true, ...availability })); process.exitCode = 2; return; }
  const environment = { ...process.env, PGHOST: host, PGPORT: '5432', PGDATABASE: 'neondb',
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGSSLMODE: 'verify-full', PGCONNECT_TIMEOUT: '10',
    PGOPTIONS: '-c statement_timeout=20000 -c lock_timeout=10000 -c idle_in_transaction_session_timeout=20000' };
  for (const field of ['PGSERVICE', 'PGSERVICEFILE', 'PGHOSTADDR', 'DATABASE_URL', 'JFQ_STOCK_TEST_URL']) delete environment[field];
  async function execute(statements) {
    const actor = session(environment);
    try { actor.send(['BEGIN', ...statements]); return await actor.commit(); }
    finally { await actor.abort(); }
  }
  function requireSuccess(result, name) { if (!result.ok) throw new Error(`PostgreSQL check failed: ${name}. Sensitive connection details withheld.`); }
  const baseline = await readFile(new URL('../test/fixtures/stock-baseline.sql', import.meta.url), 'utf8');
  const migration = [await readFile(new URL('../prisma/migrations/20261102200000_order_stock_ledger/migration.sql', import.meta.url), 'utf8'),
    await readFile(new URL('../prisma/migrations/20261102210000_pagamento_conciliacoes/migration.sql', import.meta.url), 'utf8')].join('\n'); // both migrations, in deploy order
  let sequential = 0, concurrent = 0;
  const started = Date.now();
  for (let round = 1; round <= rounds; round++) {
    const schema = `jfq_stock_${started}_${round}`;
    const suite = stockPostgresSuite(schema, baseline, migration);
    requireSuccess(await execute(suite.baseline), 'isolated baseline');
    requireSuccess(await execute(suite.migration), 'ledger migration');
    console.log(JSON.stringify({ round, schema, migrations: 'ledger + reconciliation applied only to new isolated schema' }));
    for (const step of suite.steps) {
      const result = await execute(step.statements);
      if (step.expectedError) {
        if (result.ok || !result.stderr.includes(step.expectedError)) throw new Error(`Expected invariant not observed: ${step.name}`);
      } else requireSuccess(result, step.name);
      if (step.verify.length) requireSuccess(await execute(step.verify), `${step.name}: rollback verification`);
      sequential++; console.log(`PASS sequential round=${round}: ${step.name}`);
    }
    for (const race of suite.races) {
      const a = session(environment), b = session(environment);
      try {
        a.send(['BEGIN', frame('session_ready')]); b.send(['BEGIN', frame('session_ready')]);
        const [sa, sb] = await Promise.all([a.waitFor('session_ready'), b.waitFor('session_ready')]);
        if (sa.pid === sb.pid) throw new Error('Independent connections NOT proven.');
        a.send([...raceWork(race.a), frame('holder_ready')]);
        const holder = await a.waitFor('holder_ready'); // A has changed data and still holds its locks.
        b.send(raceWork(race.b)); // The actual competing operation must wait on A before A can commit.
        let witness;
        for (let attempt = 0; attempt < 25; attempt++) {
          const observed = await execute([lockWitnessSql(sa.pid, sb.pid)]);
          requireSuccess(observed, 'lock observer');
          const value = jsonRows(observed.stdout).find(row => row.event === 'lock_witness');
          try { witness = assertLockWitness({ ...value, holderReadyAt: holder.at }); break; }
          catch { await delay(100); }
        }
        if (!witness) throw new Error(`Real lock contention NOT proven: ${race.name}`);
        // B cannot complete its mutation until this explicit coordinator barrier releases A.
        requireSuccess(await a.commit(), `${race.name}: holder commit`);
        const second = await b.commit();
        const failures = second.ok ? [] : [second];
        if (failures.length !== race.errors.length || !race.errors.every(error => failures.some(result => result.stderr.includes(error)))) {
          throw new Error(`Unexpected concurrent result: ${race.name}`);
        }
        requireSuccess(await execute(race.verify), `${race.name}: ledger and stock`);
        const snapshot = await execute([race.verify[0], `SELECT json_build_object('event','inventory_snapshot',
          'products',(SELECT json_agg(json_build_object('id',id,'stock',estoque) ORDER BY id) FROM produtos),
          'ledger',(SELECT json_agg(json_build_object('item',"itemId",'order',"pedidoId",'type',tipo,'quantity',quantidade,'debit',"debitoOrigemId") ORDER BY "itemId",tipo) FROM estoque_movimentos))`]);
        requireSuccess(snapshot, 'inventory evidence');
        concurrent++;
        console.log(JSON.stringify({ result: 'PASS real contention', round, scenario: race.name, witness,
          snapshot: jsonRows(snapshot.stdout).find(row => row.event === 'inventory_snapshot') }));
      } finally { await Promise.all([a.abort(), b.abort()]); }
    }
    requireSuccess(await execute(suite.final), 'global ledger consistency');
  }
  console.log(JSON.stringify({ sequentialPassed: sequential, concurrentPassed: concurrent, rounds, schemasRetained: true, prismaRestTested: false }));
}
main().catch(error => { console.error(JSON.stringify({ status: 'FAILED_OR_BLOCKED', reason: error.message, releaseApproved: false, existingFixturesRetained: true })); process.exitCode = 1; });
