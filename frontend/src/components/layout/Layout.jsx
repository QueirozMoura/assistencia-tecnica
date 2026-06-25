import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'

export default function Layout() {
  const [cartOpen, setCartOpen] = useState(false)
  const cart = useCart()
  const wishlist = useWishlist()

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9ff]">
      <Navbar
        cartCount={cart.count}
        wishlistCount={wishlist.count}
        cartItems={cart.items}
        onCartOpen={() => setCartOpen(true)}
      />

      <main className="flex-1">
        <Outlet context={{ cart, wishlist }} />
      </main>

      <Footer />
      <WhatsAppButton />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        onRemove={cart.removeItem}
        onUpdateQty={cart.updateQuantity}
        total={cart.total}
      />
    </div>
  )
}
