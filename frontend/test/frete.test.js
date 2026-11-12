import test from 'node:test'
import assert from 'node:assert/strict'
import { formatCep, isCepValido, somenteDigitosCep, faltaParaFreteGratis, subtotalGaranteFreteGratis, LIMITE_FRETE_GRATIS, FRETE_FIXO } from '../src/utils/frete.js'

test('regras comerciais exibidas: frete fixo R$ 50 e frete grátis acima de R$ 799', () => {
  assert.equal(FRETE_FIXO, 50)
  assert.equal(LIMITE_FRETE_GRATIS, 799)
})

test('máscara e validação de CEP', () => {
  assert.equal(formatCep('01310100'), '01310-100')
  assert.equal(formatCep('01310-1'), '01310-1')
  assert.equal(formatCep('0131010099'), '01310-100')
  assert.equal(formatCep('abc'), '')
  assert.equal(somenteDigitosCep('01.310-100'), '01310100')
  assert.equal(isCepValido('01310-100'), true)
  assert.equal(isCepValido('01310100'), true)
  for (const cep of ['', '1234', '01310-10', null, undefined]) assert.equal(isCepValido(cep), false, String(cep))
})

test('quanto falta para o frete grátis (somente ACIMA de R$ 799,00)', () => {
  assert.equal(faltaParaFreteGratis(100), 699.01)
  assert.equal(faltaParaFreteGratis(798.99), 0.02)
  assert.equal(faltaParaFreteGratis(799), 0.01)
  assert.equal(subtotalGaranteFreteGratis(799), false)
  assert.equal(faltaParaFreteGratis(799.01), 0)
  assert.equal(subtotalGaranteFreteGratis(1500), true)
  assert.equal(faltaParaFreteGratis(0.1 + 0.2), 798.71)
  for (const v of [-1, NaN, 'abc']) assert.equal(faltaParaFreteGratis(v), null, String(v))
})

import { resumoValoresPedido } from '../src/utils/frete.js'

test('resumoValoresPedido separa subtotal, frete e total', () => {
  assert.deepEqual(resumoValoresPedido({ valorTotal: '849.00', valorFrete: '50.00' }), { subtotal: 799, frete: 50, total: 849 })
  assert.deepEqual(resumoValoresPedido({ valorTotal: 899.98, valorFrete: 0 }), { subtotal: 899.98, frete: 0, total: 899.98 })
})

test('resumoValoresPedido trata pedidos antigos sem valorFrete e valores inválidos', () => {
  assert.deepEqual(resumoValoresPedido({ valorTotal: 120.5 }), { subtotal: 120.5, frete: 0, total: 120.5 })
  assert.deepEqual(resumoValoresPedido({ valorTotal: 100, valorFrete: 500 }), { subtotal: 100, frete: 0, total: 100 })
  assert.deepEqual(resumoValoresPedido(null), { subtotal: 0, frete: 0, total: 0 })
})

import { normalizarTexto } from '../src/utils/frete.js'

test('normalizarTexto ignora acentos, caixa, pontuação e espaços repetidos', () => {
  assert.equal(normalizarTexto('  São   Paulo. '), 'sao paulo')
  assert.equal(normalizarTexto('SANTO ANDRÉ'), normalizarTexto('Santo Andre'))
  assert.equal(normalizarTexto(null), '')
})
