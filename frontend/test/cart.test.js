import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartItem, updateCartQuantity, restoreCart, cartTotal, getItemPrice } from '../src/utils/cart.js'

const product = { id: 1, preco: '20.00', precoPromocional: '10.10', estoque: 4, ativo: true }

test('cart uses the promotional price for API products and rounds totals in cents', () => {
  const items = addCartItem([], product, 3)
  assert.equal(getItemPrice(items[0]), 10.1)
  assert.equal(cartTotal(items), 30.3)
})
test('cart supports legacy price aliases and invalid prices cannot produce NaN', () => {
  for (const item of [{ price: '2.50' }, { preco: '2.50' }, { precoUnitario: '2.50' }, { produto: { preco: '2.50' } }]) assert.equal(getItemPrice(item), 2.5)
  assert.equal(getItemPrice({ price: 'invalid' }), 0)
  assert.equal(getItemPrice({ price: -1 }), 0)
})
test('repeated additions combine an item and clamp its stock', () => {
  const items = addCartItem(addCartItem([], product, 2), product, 3)
  assert.equal(items.length, 1)
  assert.equal(items[0].quantity, 4)
})
for (const value of [0, -1, 1.5, NaN, Infinity, 'invalid', null, undefined]) {
  test(`cart rejects invalid addition quantity ${String(value)}`, () => {
    // undefined means the documented default quantity of 1.
    const result = addCartItem([], product, value)
    assert.equal(result.length, value === undefined ? 1 : 0)
  })
}
test('cart cannot add unavailable, inactive or missing products', () => {
  for (const fixture of [null, {}, { ...product, estoque: 0 }, { ...product, ativo: false }, { ...product, inStock: false }]) assert.deepEqual(addCartItem([], fixture), [])
})
test('quantity updates accept numeric strings and preserve an integer count', () => {
  const result = updateCartQuantity(addCartItem([], product), 1, '3')
  assert.equal(result[0].quantity, 3)
  assert.equal(cartTotal(result), 30.3)
})
test('invalid quantity updates do not corrupt a cart and zero removes the item', () => {
  const items = addCartItem([], product)
  for (const value of [NaN, Infinity, 1.1, 'invalid']) assert.deepEqual(updateCartQuantity(items, 1, value), items)
  assert.deepEqual(updateCartQuantity(items, 1, 0), [])
})
test('quantity updates cannot exceed stock and do not alter unrelated products', () => {
  const items = addCartItem(addCartItem([], product), { id: 2, price: 1 }, 1)
  const next = updateCartQuantity(items, 1, 100)
  assert.equal(next[0].quantity, 4)
  assert.equal(next[1].quantity, 1)
})
test('stored cart restoration tolerates invalid JSON and non-array data', () => {
  for (const raw of ['invalid', '{}', 'null', '42']) assert.deepEqual(restoreCart(raw), [])
})
test('stored cart restoration validates and merges duplicate products', () => {
  const restored = restoreCart(JSON.stringify([{ ...product, quantity: 2 }, null, { ...product, quantity: 3 }, { id: 2, quantity: 'invalid' }]))
  assert.equal(restored.length, 1)
  assert.equal(restored[0].quantity, 4)
})
test('subtotal and total agree for several products, with no extra fees', () => {
  const items = addCartItem(addCartItem([], { id: 1, price: 0.1 }, 3), { id: 2, price: 0.2 }, 2)
  assert.equal(cartTotal(items), 0.7)
})
