import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, User, Menu, X, Zap, ChevronDown,
  Bell, Heart, MapPin
} from 'lucide-react';
import { useCartStore, useUIStore } from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchProducts } from '../../hooks/useProducts';
import { categoryLabels } from '../../data/products';
import { formatCurrency } from '../../utils/formatters';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { getTotalItems, toggleCart } = useCartStore();
  const { isAuthenticated, user, logout } = useAuth();
  const { isMenuOpen, toggleMenu } = useUIStore();

  const searchResults = useSearchProducts(localSearch);
  const totalItems = getTotalItems();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch) {
      navigate(`/produtos?q=${encodeURIComponent(localSearch)}`);
      setShowSearchResults(false);
    }
  };

  const categories = Object.entries(categoryLabels);

  return (
    <>
      {/* Top bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-2 px-4 text-xs hidden md:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-yellow-400" />
            Frete grátis acima de R$ 2.000
          </span>
          <span>•</span>
          <span>Parcele em até 12x sem juros</span>
          <span>•</span>
          <span>Garantia extendida JFQ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            Entregamos em todo o Brasil
          </span>
          <span>•</span>
          <span>0800 JFQ HELP</span>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100'
            : 'bg-white shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl gradient-blue flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-lg md:text-xl text-gray-900 leading-none">
                  JFQ
                </div>
                <div className="text-xs text-blue-600 font-semibold leading-none tracking-widest uppercase">
                  Assistência
                </div>
              </div>
            </Link>

            {/* Category menu - desktop */}
            <div className="hidden lg:block relative" onMouseLeave={() => setShowCategoryMenu(false)}>
              <button
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-xl hover:bg-blue-50"
                onMouseEnter={() => setShowCategoryMenu(true)}
              >
                <Menu size={16} />
                Categorias
                <ChevronDown size={14} className={`transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showCategoryMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden"
                  >
                    <div className="p-2">
                      {categories.map(([slug, label]) => (
                        <Link
                          key={slug}
                          to={`/produtos?categoria=${slug}`}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium text-gray-700"
                          onClick={() => setShowCategoryMenu(false)}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Buscar geladeira, microondas, máquina de lavar..."
                    value={localSearch}
                    onChange={(e) => {
                      setLocalSearch(e.target.value);
                      setShowSearchResults(e.target.value.length >= 2);
                    }}
                    onFocus={() => localSearch.length >= 2 && setShowSearchResults(true)}
                    className="w-full pl-11 pr-4 py-2.5 md:py-3 bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-blue-300 rounded-2xl text-sm outline-none transition-all placeholder-gray-400 focus:shadow-md"
                  />
                </div>

                {/* Search results dropdown */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden z-50"
                    >
                      {searchResults.slice(0, 5).map((product) => (
                        <Link
                          key={product.id}
                          to={`/produto/${product.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-xl"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(product.price)}
                          </span>
                        </Link>
                      ))}
                      {searchResults.length > 5 && (
                        <button
                          onClick={() => {
                            navigate(`/produtos?q=${encodeURIComponent(localSearch)}`);
                            setShowSearchResults(false);
                          }}
                          className="w-full text-center py-3 text-sm text-blue-600 font-semibold hover:bg-blue-50 transition-colors border-t border-gray-100"
                        >
                          Ver todos os {searchResults.length} resultados
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Wishlist */}
              <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors relative text-gray-600 hover:text-blue-600">
                <Heart size={20} />
              </button>

              {/* Notifications */}
              <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors relative text-gray-600 hover:text-blue-600">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      setShowUserMenu(!showUserMenu);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                    {isAuthenticated && user ? (
                      <span className="text-xs font-bold text-blue-700">
                        {user.name.charAt(0)}
                      </span>
                    ) : (
                      <User size={16} className="text-blue-600" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    {isAuthenticated && user ? (
                      <>
                        <div className="text-xs text-gray-500 leading-none">Olá,</div>
                        <div className="text-sm font-semibold text-gray-900 leading-none mt-0.5">
                          {user.name.split(' ')[0]}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-gray-500 leading-none">Faça</div>
                        <div className="text-sm font-semibold text-gray-900 leading-none mt-0.5">Login</div>
                      </>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {showUserMenu && isAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        {[
                          { label: 'Minha Conta', to: '/conta' },
                          { label: 'Meus Pedidos', to: '/conta/pedidos' },
                          { label: 'Endereços', to: '/conta/enderecos' },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                        <button
                          onClick={() => { logout(); setShowUserMenu(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                        >
                          Sair
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors relative group"
              >
                <div className="relative">
                  <ShoppingCart size={22} className="text-gray-700 group-hover:text-blue-600 transition-colors" />
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs text-gray-500 leading-none">Carrinho</div>
                  <div className="text-sm font-semibold text-gray-900 leading-none mt-0.5">
                    {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                  </div>
                </div>
              </button>

              {/* Mobile menu */}
              <button
                onClick={toggleMenu}
                className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
                {categories.map(([slug, label]) => (
                  <Link
                    key={slug}
                    to={`/produtos?categoria=${slug}`}
                    className="block px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
                    onClick={toggleMenu}
                  >
                    {label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  {isAuthenticated ? (
                    <>
                      <Link to="/conta" className="block px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700" onClick={toggleMenu}>Minha Conta</Link>
                      <button onClick={() => { logout(); toggleMenu(); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600">Sair</button>
                    </>
                  ) : (
                    <Link to="/login" className="block px-4 py-3 rounded-xl hover:bg-blue-50 text-sm font-semibold text-blue-600" onClick={toggleMenu}>Entrar / Cadastrar</Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
