import test from 'node:test'
import assert from 'node:assert/strict'
import { FINAL_STATUSES, isMoneyConfirmed, label, nextStatuses, requiresNote, STATUS_LABELS, TIPO_LABELS, verificationTone } from '../src/utils/conciliacao.js'

test('only a provider-confirmed approved payment is shown as money received', () => {
  assert.equal(isMoneyConfirmed({ verificacao: 'CONFIRMADO_PELO_PROVEDOR', statusProvedor: 'approved' }), true)
  assert.equal(isMoneyConfirmed({ verificacao: 'CONFIRMADO_PELO_PROVEDOR', statusProvedor: 'refunded' }), false)
  for (const verificacao of ['NAO_VERIFICADO', 'SUSPEITO']) assert.equal(isMoneyConfirmed({ verificacao, statusProvedor: 'approved' }), false)
  assert.equal(isMoneyConfirmed(null), false)
})
test('status workflow: open items advance, resolved items offer no action', () => {
  assert.deepEqual(nextStatuses('PENDENTE'), ['EM_ANALISE', ...FINAL_STATUSES])
  assert.deepEqual(nextStatuses('EM_ANALISE'), FINAL_STATUSES)
  for (const status of FINAL_STATUSES) assert.deepEqual(nextStatuses(status), [])
  assert.deepEqual(nextStatuses('DESCONHECIDO'), [])
})
test('a written justification is required exactly for final statuses', () => {
  for (const status of FINAL_STATUSES) assert.equal(requiresNote(status), true)
  assert.equal(requiresNote('EM_ANALISE'), false)
})
test('every status and type has a readable label, tones separate confirmed from unverified and suspicious', () => {
  for (const status of ['PENDENTE', 'EM_ANALISE', ...FINAL_STATUSES]) assert.ok(STATUS_LABELS[status])
  assert.equal(Object.keys(TIPO_LABELS).length, 7)
  assert.equal(label(TIPO_LABELS, 'OUTRO'), 'OUTRO'); assert.equal(label(TIPO_LABELS, null), '—')
  assert.equal(verificationTone('CONFIRMADO_PELO_PROVEDOR'), 'confirmed')
  assert.equal(verificationTone('NAO_VERIFICADO'), 'warning')
  assert.equal(verificationTone('SUSPEITO'), 'danger')
})
