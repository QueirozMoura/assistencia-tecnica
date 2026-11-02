// Evidence checks are deliberately stricter than merely overlapping BEGIN timestamps.
export function rehearsalRounds(value = '3') {
  if (!/^[0-9]+$/.test(String(value))) throw new Error('Use 3 to 10 rehearsal rounds.');
  const rounds = Number(value);
  if (!Number.isInteger(rounds) || rounds < 3 || rounds > 10) throw new Error('Use 3 to 10 rehearsal rounds.');
  return rounds;
}
function validPid(value) { return Number.isSafeInteger(value) && value > 0; }
export function lockWitnessSql(holderPid, waiterPid) {
  if (!validPid(holderPid) || !validPid(waiterPid) || holderPid === waiterPid) throw new Error('Independent session PIDs required.');
  return `SELECT json_build_object('event','lock_witness','holderPid',${holderPid},'waiterPid',pid,
    'observerPid',pg_backend_pid(),'observedAt',clock_timestamp(),'waiterStartedAt',query_start,
    'waitEventType',wait_event_type,'waiterState',state,'blockers',pg_blocking_pids(pid),
    'holderPresent',EXISTS(SELECT 1 FROM pg_stat_activity WHERE pid=${holderPid} AND xact_start IS NOT NULL
      AND state IN ('active','idle in transaction')))
    FROM pg_stat_activity WHERE pid=${waiterPid}`;
}
export function assertLockWitness(evidence) {
  const { holderPid, waiterPid, observerPid, holderReadyAt, waiterStartedAt, observedAt } = evidence ?? {};
  const times = [holderReadyAt, waiterStartedAt, observedAt].map(value => typeof value === 'string' ? Date.parse(value) : NaN);
  if (![holderPid, waiterPid, observerPid].every(validPid) || new Set([holderPid, waiterPid, observerPid]).size !== 3 ||
      evidence.event !== 'lock_witness' || evidence.holderPresent !== true || evidence.waiterState !== 'active' ||
      evidence.waitEventType !== 'Lock' || !Array.isArray(evidence.blockers) || !evidence.blockers.includes(holderPid) ||
      times.some(time => !Number.isFinite(time)) || times[1] < times[0] || times[2] < times[1]) {
    throw new Error('Real database lock contention NOT proven.');
  }
  return evidence;
}
export function raceWork(statements) {
  return statements.filter(statement => !statement.startsWith('SELECT pg_backend_pid() AS backend_pid') &&
    statement !== 'SELECT clock_timestamp() AS ended' && !/^SELECT pg_sleep\(/.test(statement));
}
