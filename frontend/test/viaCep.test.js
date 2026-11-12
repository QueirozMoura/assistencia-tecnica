import test from 'node:test'
import assert from 'node:assert/strict'
import { consultarCep } from '../src/services/viaCep.js'

const resposta = (corpo, { ok = true, status = 200 } = {}) => async () => ({ ok, status, json: async () => corpo })

test('CEP válido: devolve rua, bairro, cidade e UF', async () => {
  let url
  const fetchImpl = async (u) => { url = u; return { ok: true, status: 200, json: async () => ({ cep: '01310-100', logradouro: ' Avenida Paulista ', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'sp' }) } }
  const r = await consultarCep('01310-100', { fetchImpl })
  assert.equal(url, 'https://viacep.com.br/ws/01310100/json/')
  assert.deepEqual(r, { status: 'found', endereco: { rua: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP' } })
})

test('CEP geral (sem rua/bairro): found com campos vazios para preenchimento manual', async () => {
  const r = await consultarCep('06800000', { fetchImpl: resposta({ logradouro: '', bairro: '', localidade: 'Embu das Artes', uf: 'SP' }) })
  assert.equal(r.status, 'found')
  assert.deepEqual(r.endereco, { rua: '', bairro: '', cidade: 'Embu das Artes', estado: 'SP' })
})

test('CEP inexistente: notfound (erro true no corpo ou HTTP 400)', async () => {
  assert.deepEqual(await consultarCep('99999999', { fetchImpl: resposta({ erro: true }) }), { status: 'notfound' })
  assert.deepEqual(await consultarCep('99999999', { fetchImpl: resposta({ erro: 'true' }) }), { status: 'notfound' })
  assert.deepEqual(await consultarCep('99999999', { fetchImpl: resposta({}, { ok: false, status: 400 }) }), { status: 'notfound' })
})

test('API indisponível: erro de rede, HTTP 5xx e resposta inválida viram status error (sem lançar)', async () => {
  assert.deepEqual(await consultarCep('01310100', { fetchImpl: async () => { throw new TypeError('Failed to fetch') } }), { status: 'error' })
  assert.deepEqual(await consultarCep('01310100', { fetchImpl: resposta({}, { ok: false, status: 503 }) }), { status: 'error' })
  assert.deepEqual(await consultarCep('01310100', { fetchImpl: resposta(null) }), { status: 'error' })
  assert.deepEqual(await consultarCep('01310100', { fetchImpl: resposta({ foo: 'bar' }) }), { status: 'error' })
  assert.deepEqual(await consultarCep('01310100', { fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('JSON') } }) }), { status: 'error' })
})

test('timeout: aborta a requisição e devolve error', async () => {
  let abortado = false
  const fetchImpl = (u, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => { abortado = true; reject(new DOMException('Aborted', 'AbortError')) })
  })
  const inicio = Date.now()
  const r = await consultarCep('01310100', { fetchImpl, timeoutMs: 30 })
  assert.deepEqual(r, { status: 'error' })
  assert.equal(abortado, true)
  assert.ok(Date.now() - inicio < 1000)
})

test('CEP inválido não chama a API', async () => {
  let chamadas = 0
  const fetchImpl = async () => { chamadas += 1; return { ok: true, json: async () => ({}) } }
  for (const cep of ['', '123', '0131010', null, undefined]) assert.deepEqual(await consultarCep(cep, { fetchImpl }), { status: 'error' })
  assert.equal(chamadas, 0)
})
