import { useState, useCallback } from 'react'

export function useWishlist() {
  const [items, setItems] = useState([])

  const toggle = useCallback((product) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === product.id)
      if (exists) return prev.filter((i) => i.id !== product.id)
      return [...prev, product]
    })
  }, [])

  const isWishlisted = useCallback(
    (productId) => items.some((i) => i.id === productId),
    [items]
  )

  const count = items.length

  return { items, toggle, isWishlisted, count }
}
