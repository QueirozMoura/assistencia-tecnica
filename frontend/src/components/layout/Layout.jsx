import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'
import CartDrawer from './CartDrawer'
import CookieConsent from './CookieConsent'
import {
  COOKIE_DEFAULT_PREFERENCES,
  normalizeCookiePreferences,
} from '../../constants/cookies'
import { useCart } from '../../hooks/useCart'
import { useWishlist } from '../../hooks/useWishlist'

const COOKIE_PREFERENCES_STORAGE_KEY = 'assistencia:cookie-preferences'

export default function Layout() {
  const [cartOpen, setCartOpen] = useState(false)
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false)
  const [cookiePreferences, setCookiePreferences] = useState(() => {
    const raw = localStorage.getItem(COOKIE_PREFERENCES_STORAGE_KEY)
    if (!raw) return null

    try {
      return normalizeCookiePreferences(JSON.parse(raw))
    } catch {
      return null
    }
  })

  const cart = useCart()
  const wishlist = useWishlist()

  const shouldShowCookieBanner = useMemo(() => cookiePreferences === null, [cookiePreferences])

  const persistCookiePreferences = (preferences) => {
    const normalized = normalizeCookiePreferences(preferences)
    localStorage.setItem(COOKIE_PREFERENCES_STORAGE_KEY, JSON.stringify(normalized))
    setCookiePreferences(normalized)
  }

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

      <Footer onOpenCookieSettings={() => setCookieSettingsOpen(true)} />
      <WhatsAppButton />

      <CookieConsent
        shouldShowBanner={shouldShowCookieBanner}
        openSettings={cookieSettingsOpen}
        currentPreferences={cookiePreferences}
        onAcceptAll={() => persistCookiePreferences({
          essentials: true,
          statistics: true,
          marketing: true,
        })}
        onAcceptEssential={() => {
          persistCookiePreferences({
            essentials: true,
            statistics: false,
            marketing: false,
          })
          setCookieSettingsOpen(false)
        }}
        onSavePreferences={(preferences) => {
          persistCookiePreferences(preferences)
          setCookieSettingsOpen(false)
        }}
        onOpenSettings={() => setCookieSettingsOpen(true)}
        onCloseSettings={() => setCookieSettingsOpen(false)}
      />

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
