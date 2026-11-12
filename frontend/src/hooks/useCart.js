import { useState, useCallback, useEffect } from 'react'
import { addCartItem, updateCartQuantity, restoreCart, cartTotal } from '../utils/cart'
import { getPrimaryImage } from '../services/imageMap'
export { getItemPrice } from '../utils/cart'

const CART_STORAGE_KEY = 'jfq-cart'

// Garante o formato único do carrinho (name, image, brand), seja qual for a origem do produto:
// card (já normalizado), página individual ou barra fixa (campos da API em português),
// e também itens antigos salvos no localStorage.
const normalizeCartProduct = (product) => {
  if (!product || typeof product !== 'object') return product
  return {
    ...product,
    name: product.name ?? product.nome ?? '',
    image: product.image || getPrimaryImage(product) || '',
    brand: product.brand ?? product.marca ?? product.categoria?.nome ?? '',
  }
}

const getInitialItems = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    return restoreCart(raw).map(normalizeCartProduct)
  } catch {
    return []
  }
}

export function useCart() {
  const [items, setItems] = useState(getInitialItems)

  useEffect(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)) } catch { /* Storage may be unavailable. */ }
  }, [items])

  const addItem = useCallback((product, quantity = 1) => {
    setItems(prev => addCartItem(prev, normalizeCartProduct(product), quantity))
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    setItems(prev => updateCartQuantity(prev, productId, quantity))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    try { localStorage.removeItem(CART_STORAGE_KEY) } catch { /* Storage may be unavailable. */ }
  }, [])

  const total = cartTotal(items)
  const count = items.reduce((sum, i) => sum + Number(i.quantity), 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, count }
}
