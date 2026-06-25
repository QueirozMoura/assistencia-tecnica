import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopbar  from './AdminTopbar'

export default function AdminLayout() {
  // Sidebar colapsada por padrão em telas menores
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024)
  // Overlay mobile (sidebar aberta sobre o conteúdo)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fechar sidebar mobile ao redimensionar para desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function toggleCollapsed() {
    if (window.innerWidth >= 1024) {
      setCollapsed((c) => !c)
    } else {
      setMobileOpen((o) => !o)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff]">

      {/* ── Overlay mobile ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      {/* Desktop: sempre visível, colapsável */}
      <div className="hidden lg:block">
        <AdminSidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Mobile: drawer deslizante */}
      <div
        className={`
          lg:hidden fixed top-0 left-0 h-full z-30 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <AdminSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* ── Topbar ──────────────────────────────────────────────── */}
      <AdminTopbar
        sidebarCollapsed={collapsed}
        onMenuToggle={toggleCollapsed}
      />

      {/* ── Conteúdo principal ──────────────────────────────────── */}
      <main
        className={`
          pt-16 min-h-screen transition-all duration-300
          ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}
        `}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
