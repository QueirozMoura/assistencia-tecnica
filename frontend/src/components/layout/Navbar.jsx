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
      { label: 'Máquinas de Lavar', to: '/catalogo?categoria=maquina-de-lavar', icon: Package },
      { label: 'Lava e Seca', to: '/catalogo?categoria=lava-e-seca', icon: Package },
      { label: 'Centrífugas', to: '/catalogo?categoria=centrifuga', icon: Package },
      { label: 'Peças e Acessórios', to: '/catalogo?categoria=pecas', icon: Package },
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
      <div className="bg-[#003366] text-white text-xs py-2 hidden md:block">
        <div className="container-max flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone size={12} />
              (11) 9999-9999
            </span>
            <span>|</span>
            <span>Seg–Sáb: 8h às 18h</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Frete grátis para pedidos acima de R$ 299</span>
            <span>|</span>
            <Link to="/agendamento" className="hover:text-blue-200 transition-colors font-medium">
              Agendar Visita Técnica
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-md'
            : 'bg-white border-b border-[#c3c6d1]'
        }`}
      >
        <div className="container-max flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-[#003366] rounded-lg flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="block font-bold text-[#003366] text-lg leading-none">Eletro</span>
              <span className="block font-bold text-[#0070ea] text-lg leading-none">Center</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
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
                    `flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#0070ea] bg-blue-50'
                        : 'text-[#43474f] hover:text-[#003366] hover:bg-gray-50'
                    }`
                  }
                >
                  {link.label}
                  {link.mega && <ChevronDown size={14} className={`transition-transform ${megaOpen === link.label ? 'rotate-180' : ''}`} />}
                </NavLink>

                {/* Mega Menu */}
                {link.mega && megaOpen === link.label && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-[#e5e8ee] py-2 z-50">
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

          {/* Search + Actions */}
          <div className="flex items-center gap-1 lg:-ml-4">
            {/* Search Bar (desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center bg-[#f1f4f9] rounded-full px-4 py-2 gap-2 w-48 lg:w-64 border border-transparent focus-within:border-[#0070ea] focus-within:bg-white transition-all">
              <Search size={15} className="text-[#737780] flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-[#181c20] placeholder-[#737780] outline-none w-full"
              />
            </form>

            {/* Wishlist */}
            <Link
              to="/catalogo"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-[#43474f] hover:text-[#003366]"
              title="Lista de Desejos"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0070ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={onCartOpen}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-[#43474f] hover:text-[#003366]"
              title="Carrinho"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0070ea] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-[#e5e8ee] bg-white pl-1 pr-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-[#0070ea] text-white text-sm font-bold flex items-center justify-center">
                    {avatarInitial}
                  </span>
                  <span className="hidden lg:block text-sm font-medium text-[#43474f] max-w-[110px] truncate">
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
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-lg text-sm leading-5 font-semibold text-[#43474f] bg-white border border-[#d8dce5] hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-lg text-sm leading-5 font-semibold text-white bg-[#0070ea] hover:bg-[#0059bb] transition-colors whitespace-nowrap"
                >
                  Criar conta
                </Link>
              </div>
            )}

            {/* CTA Agendar */}
            <Link
              to="/agendamento"
              className="hidden lg:inline-flex items-center justify-center h-10 gap-2 bg-[#0070ea] text-white px-4 py-2 rounded-lg text-sm leading-5 font-semibold hover:bg-[#0059bb] transition-colors"
            >
              <Wrench size={14} />
              Agendar
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors text-[#43474f]"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-[#e5e8ee] px-4 py-4 space-y-1">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex items-center bg-[#f1f4f9] rounded-full px-4 py-2.5 gap-2 mb-4">
              <Search size={15} className="text-[#737780]" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-[#181c20] placeholder-[#737780] outline-none w-full"
              />
            </form>

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

            <div className="pt-3 border-t border-[#e5e8ee]">
              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2">
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
