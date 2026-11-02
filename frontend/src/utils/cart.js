export const getItemPrice = (item) => {
  const price = Number(item?.precoPromocional ?? item?.produto?.precoPromocional ?? item?.price ?? item?.preco ?? item?.precoUnitario ?? item?.produto?.preco ?? 0)
  return Number.isFinite(price) && price >= 0 ? price : 0
}

export function cartQuantity(value, product) {
  const quantity = Number(value)
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || product?.ativo === false || product?.inStock === false) return 0
  if (product?.estoque != null) {
    const stock = Number(product.estoque)
    return Number.isSafeInteger(stock) && stock >= 0 ? Math.min(quantity, stock) : 0
  }
  return quantity
}

export function addCartItem(items, product, quantity = 1) {
  if (!product?.id || !cartQuantity(quantity, product)) return items
  const existing = items.find(item => String(item.id) === String(product.id))
  const nextQuantity = cartQuantity(Number(existing?.quantity || 0) + Number(quantity), product)
  if (!nextQuantity) return items
  const next = { ...product, price: getItemPrice(product), quantity: nextQuantity }
  return existing
    ? items.map(item => String(item.id) === String(product.id) ? next : item)
    : [...items, next]
}

export function updateCartQuantity(items, id, value) {
  const quantity = Number(value)
  if (Number.isFinite(quantity) && quantity <= 0) return items.filter(item => String(item.id) !== String(id))
  if (!Number.isSafeInteger(quantity)) return items
  return items.flatMap(item => {
    if (String(item.id) !== String(id)) return [item]
    const next = cartQuantity(quantity, item)
    return next ? [{ ...item, quantity: next }] : []
  })
}

export function restoreCart(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.reduce((items, item) => addCartItem(items, item, item?.quantity), [])
  } catch { return [] }
}

export function cartTotal(items) {
  return items.reduce((sum, item) => sum + Math.round(getItemPrice(item) * 100) * Number(item.quantity), 0) / 100
}
