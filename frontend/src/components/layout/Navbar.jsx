import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Search, ShoppingCart, Heart, Menu, X, Phone, ChevronDown,
  Wrench, Package, Star, Zap, User, LogOut,
} from 'lucide-react'
import { useClientAuth } from '../../hooks/useClientAuth'

const navLinks = [
  { label: 'Início', to: '/' },
  {
    label: 'Produtos',
    to: '/catalogo',
    mega: [
      { label: 'Máquinas de Lavar', to: '/catalogo?categoria=maquinas-de-lavar', icon: Package },
      { label: 'Lava e Seca', to: '/catalogo?categoria=lava-e-seca', icon: Package },
      { label: 'Micro-ondas', to: '/catalogo?categoria=micro-ondas', icon: Package },
      { label: 'Geladeiras', to: '/catalogo?categoria=geladeiras', icon: Package },
      { label: 'Centrífugas', to: '/catalogo?categoria=centrifugas', icon: Package },
      { label: 'Peças e Acessórios', to: '/catalogo?categoria=pecas-e-acessorios', icon: Package },
    ],
  },
  {
    label: 'Assistência',
    to: '/assistencia',
    mega: [
      { label: 'Conserto de Máquina', to: '/assistencia#conserto', icon: Wrench },
      { label: 'Manutenção Preventiva', to: '/assistencia#manutencao', icon: Star },
      { label: 'Instalação', to: '/assistencia#instalacao', icon: Zap },
      { label: 'Atendimento Emergencial', to: '/assistencia#emergencial', icon: Zap },
    ],
  },
  { label: 'Sobre Nós', to: '/sobre' },
  { label: 'Contato', to: '/contato' },
]

export default function Navbar({ cartCount = 0, wishlistCount = 0, onCartOpen }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const { cliente, isAuthenticated, logout } = useClientAuth()
  const profileRef = useRef(null)

  const firstName = cliente?.nome?.trim()?.split(' ')?.[0] || ''
  const avatarInitial = firstName ? firstName.charAt(0).toUpperCase() : 'U'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') setProfileOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/catalogo?busca=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#003366] text-white text-[11px] sm:text-xs py-2 hidden md:block">
        <div className="container-max flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1">
              <Phone size={12} />
              (11) 96560-2135
            </span>
            <span className="hidden sm:inline">|</span>
            <span>Seg–Sáb: 8h às 18h</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span>Frete grátis acima de R$ 799 nas regiões atendidas</span>
            <span className="hidden sm:inline">|</span>
            <Link to="/agendamento" className="hover:text-blue-200 transition-colors font-medium">
              Agendar Visita Técnica
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_4px_20px_-8px_rgba(0,51,102,0.25)]' : 'border-b border-[#e5e8ee]'
        }`}
      >
        {/* Row 1: logo, search, account, wishlist, cart */}
        <div className="container-max flex items-center gap-3 sm:gap-6 h-16 lg:h-20">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden -ml-2 p-2 rounded-lg hover:bg-[#f1f4f9] transition-colors text-[#003366] focus-visible:outline-2 focus-visible:outline-[#0070ea]"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0" aria-label="JFQ Assistência - Início">
            <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#0070ea] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Wrench size={20} className="text-white" />
            </div>
            <div className="leading-none min-w-0">
              <span className="block font-extrabold text-[#003366] text-lg tracking-tight">JFQ</span>
              <span className="block font-semibold text-[#0070ea] text-[11px] sm:text-xs tracking-wide mt-0.5">Assistência Técnica</span>
            </div>
          </Link>

          {/* Search Bar (desktop) */}
          <form
            onSubmit={handleSearch}
            role="search"
            className="hidden lg:flex flex-1 max-w-2xl mx-auto items-center h-12 bg-[#f1f4f9] rounded-full pl-5 pr-1.5 gap-3 border border-transparent hover:border-[#c3d4ea] focus-within:border-[#0070ea] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,112,234,0.12)] transition-all"
          >
            <Search size={18} className="text-[#737780] flex-shrink-0" />
            <input
              type="search"
              aria-label="Buscar produtos"
              placeholder="Buscar produtos, peças e acessórios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#181c20] placeholder-[#737780] outline-none w-full"
            />
            <button
              type="submit"
              className="h-9 px-5 rounded-full bg-[#0070ea] text-white text-sm font-semibold hover:bg-[#0059bb] transition-colors flex-shrink-0"
            >
              Buscar
            </button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0 flex-shrink-0">
            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-full border border-[#e5e8ee] bg-white pl-1 pr-3 py-1 hover:border-[#0070ea] hover:bg-[#f7f9ff] transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-[#0070ea] text-white text-sm font-bold flex items-center justify-center">
                    {avatarInitial}
                  </span>
                  <span className="hidden xl:block text-sm font-medium text-[#43474f] max-w-[110px] truncate">
                    {firstName || 'Minha Conta'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[#737780] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`absolute right-0 mt-2 w-56 bg-white border border-[#e5e8ee] rounded-xl shadow-lg py-2 z-50 origin-top-right transition-all duration-200 ${
                    profileOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <Link
                    to="/minha-conta"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#43474f] hover:bg-blue-50 hover:text-[#0070ea] transition-colors"
                  >
                    <User size={15} />
                    Minha Conta
                  </Link>
                  <Link
                    to="/meus-pedidos"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#43474f] hover:bg-blue-50 hover:text-[#0070ea] transition-colors"
                  >
                    <Package size={15} />
                    Meus Pedidos
                  </Link>
                  <Link
                    to="/meus-agendamentos"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#43474f] hover:bg-blue-50 hover:text-[#0070ea] transition-colors"
                  >
                    <Wrench size={15} />
                    Meus Agendamentos
                  </Link>

                  <div className="my-1 border-t border-[#e5e8ee]" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 mr-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-semibold text-[#003366] hover:bg-[#f1f4f9] transition-colors whitespace-nowrap"
                >
                  <User size={17} />
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-semibold text-[#0070ea] border border-[#0070ea] hover:bg-[#0070ea] hover:text-white transition-colors whitespace-nowrap"
                >
                  Criar conta
                </Link>
              </div>
            )}

            {/* Wishlist */}
            <Link
              to="/catalogo"
              className="relative p-2.5 rounded-full hover:bg-[#f1f4f9] transition-colors text-[#43474f] hover:text-[#003366] flex-shrink-0"
              title="Lista de Desejos"
              aria-label="Lista de desejos"
            >
              <Heart size={21} />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-[#0070ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={onCartOpen}
              className="relative p-2.5 rounded-full hover:bg-[#f1f4f9] transition-colors text-[#43474f] hover:text-[#003366] flex-shrink-0"
              title="Carrinho"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-[#0070ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile/tablet search: always visible */}
        <div className="container-max lg:hidden pb-3">
          <form
            onSubmit={handleSearch}
            role="search"
            className="flex items-center h-11 bg-[#f1f4f9] rounded-full pl-4 pr-1.5 gap-2 border border-transparent focus-within:border-[#0070ea] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,112,234,0.12)] transition-all"
          >
            <Search size={17} className="text-[#737780] flex-shrink-0" />
            <input
              type="search"
              aria-label="Buscar produtos"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#181c20] placeholder-[#737780] outline-none w-full"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="h-8 w-8 rounded-full bg-[#0070ea] text-white flex items-center justify-center hover:bg-[#0059bb] transition-colors flex-shrink-0"
            >
              <Search size={15} />
            </button>
          </form>
        </div>

        {/* Row 2: navigation (desktop) */}
        <div className="hidden lg:block border-t border-[#eef1f6]">
          <div className="container-max flex items-center justify-between h-12">
            <nav className="flex items-center gap-1" aria-label="Principal">
              {navLinks.map((link) => (
                <div
                  key={link.to}
                  className="relative"
                  onMouseEnter={() => link.mega && setMegaOpen(link.label)}
                  onMouseLeave={() => setMegaOpen(null)}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-1 px-3.5 h-12 text-sm font-medium transition-colors after:absolute after:left-3.5 after:right-3.5 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
                        isActive
                          ? 'text-[#0070ea] after:bg-[#0070ea]'
                          : 'text-[#43474f] hover:text-[#003366] after:bg-transparent hover:after:bg-[#c3d4ea]'
                      }`
                    }
                  >
                    {link.label}
                    {link.mega && <ChevronDown size={14} className={`transition-transform ${megaOpen === link.label ? 'rotate-180' : ''}`} />}
                  </NavLink>

                  {/* Mega Menu */}
                  {link.mega && megaOpen === link.label && (
                    <div className="absolute top-full left-0 w-60 bg-white rounded-xl shadow-xl border border-[#e5e8ee] py-2 z-50">
                      {link.mega.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#43474f] hover:bg-blue-50 hover:text-[#0070ea] transition-colors"
                          onClick={() => setMegaOpen(null)}
                        >
                          <item.icon size={15} className="text-[#0070ea]" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Agendar */}
            <Link
              to="/agendamento"
              className="inline-flex items-center justify-center h-9 gap-2 bg-[#003366] text-white px-4 rounded-full text-sm font-semibold hover:bg-[#0070ea] transition-colors whitespace-nowrap"
            >
              <Wrench size={14} />
              Agendar visita técnica
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-[#e5e8ee] px-4 py-4 space-y-1 max-h-[calc(100vh-7.5rem)] overflow-y-auto">
            {navLinks.map((link) => (
              <div key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#0070ea] bg-blue-50'
                        : 'text-[#43474f] hover:bg-gray-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
                {link.mega && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.mega.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2 text-xs text-[#737780] hover:text-[#0070ea] transition-colors"
                      >
                        → {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t border-[#e5e8ee] space-y-3">
              {!isAuthenticated ? (
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 border border-[#d8dce5] text-[#43474f] px-3 py-2 rounded-lg text-sm font-semibold w-full hover:bg-gray-50 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-[#0070ea] text-white px-3 py-2 rounded-lg text-sm font-semibold w-full hover:bg-[#0059bb] transition-colors"
                  >
                    Criar conta
                  </Link>
                </div>
              ) : (
                <div className="bg-[#f7f9ff] border border-[#e5e8ee] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2 px-1 pb-2">
                    <span className="w-8 h-8 rounded-full bg-[#0070ea] text-white text-sm font-bold flex items-center justify-center">
                      {avatarInitial}
                    </span>
                    <span className="text-sm font-semibold text-[#181c20] truncate">
                      {firstName || 'Minha Conta'}
                    </span>
                  </div>

                  <Link
                    to="/minha-conta"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-[#43474f] hover:bg-white hover:text-[#0070ea] transition-colors"
                  >
                    Minha Conta
                  </Link>
                  <Link
                    to="/meus-pedidos"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-[#43474f] hover:bg-white hover:text-[#0070ea] transition-colors"
                  >
                    Meus Pedidos
                  </Link>
                  <Link
                    to="/meus-agendamentos"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-[#43474f] hover:bg-white hover:text-[#0070ea] transition-colors"
                  >
                    Meus Agendamentos
                  </Link>
                  <div className="my-1 border-t border-[#e5e8ee]" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#ba1a1a] hover:bg-red-50 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              )}

              <Link
                to="/agendamento"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 bg-[#0070ea] text-white px-4 py-3 rounded-lg text-sm font-semibold w-full"
              >
                <Wrench size={14} />
                Agendar Visita Técnica
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
