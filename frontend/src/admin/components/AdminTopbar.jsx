import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Mapa de rota → título da página
const PAGE_TITLES = {
  '/admin/dashboard':  { title: 'Dashboard',   sub: 'Visão geral do sistema' },
  '/admin/produtos':   { title: 'Produtos',     sub: 'Gerenciar catálogo de produtos' },
  '/admin/categorias': { title: 'Categorias',   sub: 'Gerenciar categorias' },
  '/admin/pedidos':    { title: 'Pedidos',       sub: 'Gerenciar pedidos dos clientes' },
  '/admin/clientes':   { title: 'Clientes',      sub: 'Gerenciar base de clientes' },
}

function getPageInfo(pathname) {
  // Tenta match exato primeiro, depois prefixo
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  const key = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k) && k !== '/admin/dashboard')
  return key ? PAGE_TITLES[key] : { title: 'Admin', sub: '' }
}

export default function AdminTopbar({ sidebarCollapsed, onMenuToggle }) {
  const { pathname } = useLocation()
  const { user }     = useAuth()
  const { title, sub } = getPageInfo(pathname)

  return (
    <header
      className={`
        fixed top-0 right-0 z-20 h-16 bg-white border-b border-[#e5e8ee]
        flex items-center justify-between px-5 transition-all duration-300
        ${sidebarCollapsed ? 'left-16' : 'left-60'}
      `}
    >
      {/* ── Esquerda: botão mobile + título ──────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Botão hamburguer (mobile) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f1f4f9] transition-colors text-[#43474f]"
          aria-label="Abrir menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div>
          <h1 className="text-base font-bold text-[#181c20] leading-tight">{title}</h1>
          {sub && <p className="text-xs text-[#737780] leading-tight hidden sm:block">{sub}</p>}
        </div>
      </div>

      {/* ── Direita: link site + avatar ──────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Link para o site público */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#737780] hover:text-[#0070ea] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f1f4f9]"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1a5.5 5.5 0 100 11A5.5 5.5 0 006.5 1z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1 6.5h11M6.5 1c-1.5 2-2 3.5-2 5.5s.5 3.5 2 5.5M6.5 1c1.5 2 2 3.5 2 5.5s-.5 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          Ver site
        </Link>

        {/* Separador */}
        <div className="w-px h-6 bg-[#e5e8ee] hidden sm:block" />

        {/* Avatar + nome */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0070ea] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.nome?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-[#181c20] leading-tight">{user?.nome}</p>
            <p className="text-[10px] text-[#737780] leading-tight">
              <span className="inline-block bg-[#cce0ff] text-[#003366] px-1.5 py-0.5 rounded text-[9px] font-bold">
                {user?.role}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
