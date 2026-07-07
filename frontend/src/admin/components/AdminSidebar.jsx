import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Produtos',
    to: '/admin/produtos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 5h12M3 9h12M3 13h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Categorias',
    to: '/admin/categorias',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Pedidos',
    to: '/admin/pedidos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 2h2l2.4 9.6a1 1 0 001 .4H14a1 1 0 001-.76L16 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7" cy="15.5" r="1" fill="currentColor"/>
        <circle cx="13" cy="15.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Clientes',
    to: '/admin/clientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function AdminSidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside
      className={`
        h-full flex flex-col overflow-x-hidden
        bg-[#001e40] text-white transition-all duration-300
        w-72 max-w-[85vw] sm:w-60 ${collapsed ? 'sm:w-16 w-16' : ''}
      `}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-[#0070ea] rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="white" strokeWidth="1.5"/>
            <path d="M2 4l2-2h8l2 2" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M6 8h4M6 11h2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight">EletroCenter</p>
            <p className="text-[10px] text-[#8fa8c8] leading-tight">Painel Admin</p>
          </div>
        )}
      </div>

      {/* ── Navegação ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 overscroll-contain">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-[#8fa8c8] uppercase tracking-widest px-3 mb-2">
            Menu
          </p>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-[#0070ea] text-white shadow-lg shadow-[#0070ea]/30'
                    : 'text-[#8fa8c8] hover:bg-white/10 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}`
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Usuário + Logout ──────────────────────────────────────── */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#0070ea] flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.nome?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.nome}</p>
              <p className="text-[10px] text-[#8fa8c8] truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
            text-[#8fa8c8] hover:bg-[#ba1a1a]/20 hover:text-[#ff8a80] transition-all
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* ── Botão colapsar (desktop) ──────────────────────────────── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#0070ea] rounded-full hidden sm:flex items-center justify-center shadow-lg hover:bg-[#0059bb] transition-colors"
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
        >
          <path d="M6 2L3 5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </aside>
  )
}
