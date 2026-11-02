import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLockWitness, lockWitnessSql, raceWork, rehearsalRounds } from './stock-concurrency.js';
const valid = { event: 'lock_witness', holderPid: 101, waiterPid: 102, observerPid: 103, holderPresent: true,
  holderReadyAt: '2026-11-02T20:00:00.000Z', waiterStartedAt: '2026-11-02T20:00:01.000Z', observedAt: '2026-11-02T20:00:02.000Z',
  waiterState: 'active', waitEventType: 'Lock', blockers: [101] };
test('proof requires actual lock wait observed by a third PostgreSQL session', () => {
  assert.equal(assertLockWitness(valid), valid);
});
for (const [name, patch] of [
  ['same backend', { waiterPid: 101 }], ['observer reused actor', { observerPid: 101 }],
  ['no lock wait', { waitEventType: null }], ['different blocker', { blockers: [999] }],
  ['holder already committed', { holderPresent: false }], ['waiter not executing', { waiterState: 'idle in transaction' }],
  ['only transaction overlap', { event: 'transaction_overlap' }], ['missing PID', { waiterPid: undefined }],
  ['invalid timestamp', { observedAt: 'invalid' }], ['stale observation', { observedAt: '2026-11-02T19:59:00Z' }],
  ['waiter started before holder barrier', { waiterStartedAt: '2026-11-02T19:59:00Z' }],
]) {
  test(`serialized or insufficient evidence rejected: ${name}`, () => {
    assert.throws(() => assertLockWitness({ ...valid, ...patch }), /NOT proven/);
  });
}
test('SQL observer uses actual blocking relationships and validates interpolated IDs', () => {
  assert.match(lockWitnessSql(101, 102), /pg_blocking_pids\(pid\)/);
  assert.match(lockWitnessSql(101, 102), /pg_stat_activity/);
  for (const ids of [[101,101], [0,102], ['101',102], ['1; SELECT 2',102], [101,Infinity]]) assert.throws(() => lockWitnessSql(...ids));
});
test('at least three independent fixture rounds are required', () => {
  assert.equal(rehearsalRounds(), 3); assert.equal(rehearsalRounds('10'), 10);
  for (const value of ['0','1','2','11','3.5','3x','',Infinity]) assert.throws(() => rehearsalRounds(value));
});
test('operation barrier removes old timestamp and sleep heuristics without removing business SQL', () => {
  assert.deepEqual(raceWork(['SET LOCAL search_path TO fixture', 'SELECT pg_backend_pid() AS backend_pid, transaction_timestamp() AS began', 'SELECT reserve()', 'SELECT pg_sleep(1)', 'SELECT clock_timestamp() AS ended']), ['SET LOCAL search_path TO fixture', 'SELECT reserve()']);
});
