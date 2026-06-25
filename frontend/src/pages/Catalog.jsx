import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, AlertCircle } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import SectionHeader from '../components/ui/SectionHeader'
import { getProdutos, getCategorias } from '../services/api'

// Constantes de UI — não são dados do banco
const priceRanges = [
  { label: 'Até R$ 500',          min: 0,    max: 500    },
  { label: 'R$ 500 a R$ 1.500',   min: 500,  max: 1500   },
  { label: 'R$ 1.500 a R$ 3.000', min: 1500, max: 3000   },
  { label: 'Acima de R$ 3.000',   min: 3000, max: 999999 },
]

const ITEMS_PER_PAGE = 9

// Skeleton de card para loading
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e8ee] animate-pulse">
      <div className="h-52 bg-[#e5e8ee]" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-[#e5e8ee] rounded w-1/3" />
        <div className="h-4 bg-[#e5e8ee] rounded w-3/4" />
        <div className="h-4 bg-[#e5e8ee] rounded w-1/2" />
        <div className="h-8 bg-[#e5e8ee] rounded-xl mt-4" />
      </div>
    </div>
  )
}

export default function Catalog() {
  const { cart, wishlist } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Filtros de UI ──────────────────────────────────────────
  const [filtersOpen, setFiltersOpen]           = useState(false)
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('categoria') ? [searchParams.get('categoria')] : []
  )
  const [selectedPriceRange, setSelectedPriceRange] = useState(null)
  const [sortBy, setSortBy]                     = useState('relevancia')
  const [page, setPage]                         = useState(1)
  const [openSection, setOpenSection]           = useState({ cat: true, price: true })

  const searchQuery = searchParams.get('busca') || ''

  // ── Estado da API — Produtos ───────────────────────────────
  const [products, setProducts]     = useState([])
  const [meta, setMeta]             = useState({ total: 0, totalPages: 1 })
  const [loadingProds, setLoadingProds] = useState(true)
  const [errorProds, setErrorProds] = useState(null)

  // ── Estado da API — Categorias ─────────────────────────────
  const [categorias, setCategorias]     = useState([])
  const [loadingCats, setLoadingCats]   = useState(true)

  // ── Buscar categorias (uma vez) ────────────────────────────
  useEffect(() => {
    getCategorias()
      .then((res) => setCategorias(res.data))
      .catch(() => setCategorias([]))
      .finally(() => setLoadingCats(false))
  }, [])

  // ── Buscar produtos (sempre que filtros/página mudam) ──────
  const fetchProducts = useCallback(() => {
    setLoadingProds(true)
    setErrorProds(null)

    const priceRange = priceRanges.find((r) => r.label === selectedPriceRange)

    const params = {
      page,
      limit: ITEMS_PER_PAGE,
      ...(searchQuery && { busca: searchQuery }),
      ...(selectedCategories.length === 1 && { categoriaSlug: selectedCategories[0] }),
      ...(priceRange && { precoMin: priceRange.min, precoMax: priceRange.max }),
    }

    // Ordenação
    if (sortBy === 'menor-preco') { params.orderBy = 'preco'; params.order = 'asc' }
    if (sortBy === 'maior-preco') { params.orderBy = 'preco'; params.order = 'desc' }
    if (sortBy === 'nome')        { params.orderBy = 'nome';  params.order = 'asc' }

    getProdutos(params)
      .then((res) => {
        setProducts(res.data)
        setMeta(res.meta)
      })
      .catch((err) => setErrorProds(err.message))
      .finally(() => setLoadingProds(false))
  }, [page, searchQuery, selectedCategories, selectedPriceRange, sortBy])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // ── Helpers ────────────────────────────────────────────────
  const toggleCategory = (slug) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((v) => v !== slug) : [...prev, slug]
    )
    setPage(1)
  }

  const clearAll = () => {
    setSelectedCategories([])
    setSelectedPriceRange(null)
    setPage(1)
  }

  const hasFilters = selectedCategories.length > 0 || selectedPriceRange

  const FilterSection = ({ title, id, children }) => (
    <div className="border-b border-[#e5e8ee] pb-4 mb-4">
      <button
        onClick={() => setOpenSection((s) => ({ ...s, [id]: !s[id] }))}
        className="flex items-center justify-between w-full text-sm font-semibold text-[#181c20] mb-3"
      >
        {title}
        {openSection[id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {openSection[id] && children}
    </div>
  )

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#003366] to-[#0059bb] py-10">
        <div className="container-max">
          <nav className="text-xs text-[#8fa8c8] mb-3 flex items-center gap-1">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <span>/</span>
            <span className="text-white">Catálogo</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo de Produtos'}
          </h1>
          <p className="text-[#8fa8c8] text-sm">
            {loadingProds
              ? 'Carregando produtos...'
              : `${meta.total} produto${meta.total !== 1 ? 's' : ''} encontrado${meta.total !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      <div className="container-max py-8">
        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-5 lg:hidden">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 bg-white border border-[#e5e8ee] px-4 py-2.5 rounded-xl text-sm font-medium text-[#43474f] shadow-sm"
          >
            <SlidersHorizontal size={16} />
            Filtros
            {hasFilters && <span className="w-2 h-2 bg-[#0070ea] rounded-full" />}
          </button>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
            className="bg-white border border-[#e5e8ee] px-3 py-2.5 rounded-xl text-sm text-[#43474f] outline-none"
          >
            <option value="relevancia">Relevância</option>
            <option value="menor-preco">Menor Preço</option>
            <option value="maior-preco">Maior Preço</option>
            <option value="nome">Nome A-Z</option>
          </select>
        </div>

        <div className="flex gap-8">
          {/* ── Sidebar ── */}
          <aside className={`w-64 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-[#181c20]">Filtros</h2>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-[#0070ea] hover:underline font-medium"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              {/* Categorias */}
              <FilterSection title="Categoria" id="cat">
                {loadingCats ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-[#e5e8ee] rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categorias.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.slug)}
                          onChange={() => toggleCategory(cat.slug)}
                          className="w-4 h-4 rounded border-[#c3c6d1] accent-[#0070ea]"
                        />
                        <span className="text-sm text-[#43474f] group-hover:text-[#181c20] transition-colors">
                          {cat.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </FilterSection>

              {/* Faixa de Preço */}
              <FilterSection title="Faixa de Preço" id="price">
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceRange === range.label}
                        onChange={() => { setSelectedPriceRange(range.label); setPage(1) }}
                        className="w-4 h-4 border-[#c3c6d1] accent-[#0070ea]"
                      />
                      <span className="text-sm text-[#43474f] group-hover:text-[#181c20] transition-colors">
                        {range.label}
                      </span>
                    </label>
                  ))}
                  {selectedPriceRange && (
                    <button
                      onClick={() => { setSelectedPriceRange(null); setPage(1) }}
                      className="text-xs text-[#0070ea] hover:underline mt-1"
                    >
                      Remover filtro
                    </button>
                  )}
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* ── Products Grid ── */}
          <div className="flex-1 min-w-0">
            {/* Sort bar (desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-5">
              <p className="text-sm text-[#737780]">
                {loadingProds ? (
                  <span className="inline-block w-40 h-4 bg-[#e5e8ee] rounded animate-pulse" />
                ) : (
                  <>
                    Exibindo{' '}
                    <span className="font-medium text-[#181c20]">{products.length}</span> de{' '}
                    <span className="font-medium text-[#181c20]">{meta.total}</span> produtos
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#737780]">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
                  className="bg-white border border-[#e5e8ee] px-3 py-2 rounded-xl text-sm text-[#43474f] outline-none focus:border-[#0070ea] transition-colors"
                >
                  <option value="relevancia">Relevância</option>
                  <option value="menor-preco">Menor Preço</option>
                  <option value="maior-preco">Maior Preço</option>
                  <option value="nome">Nome A-Z</option>
                </select>
              </div>
            </div>

            {/* Active filters chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map((slug) => {
                  const cat = categorias.find((c) => c.slug === slug)
                  return (
                    <span key={slug} className="flex items-center gap-1.5 bg-[#cce0ff] text-[#003366] text-xs font-medium px-3 py-1.5 rounded-full">
                      {cat?.nome ?? slug}
                      <button onClick={() => toggleCategory(slug)} aria-label="Remover filtro">
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
                {selectedPriceRange && (
                  <span className="flex items-center gap-1.5 bg-[#cce0ff] text-[#003366] text-xs font-medium px-3 py-1.5 rounded-full">
                    {selectedPriceRange}
                    <button onClick={() => { setSelectedPriceRange(null); setPage(1) }} aria-label="Remover filtro de preço">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Error state */}
            {errorProds && !loadingProds && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle size={40} className="text-[#ba1a1a]" />
                <p className="font-semibold text-[#181c20]">Erro ao carregar produtos</p>
                <p className="text-sm text-[#737780]">{errorProds}</p>
                <button
                  onClick={fetchProducts}
                  className="bg-[#0070ea] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0059bb] transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {loadingProds && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingProds && !errorProds && products.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#f1f4f9] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-[#c3c6d1]" />
                </div>
                <h3 className="font-semibold text-[#181c20] mb-2">Nenhum produto encontrado</h3>
                <p className="text-sm text-[#737780] mb-4">Tente ajustar os filtros ou buscar por outro termo.</p>
                <button onClick={clearAll} className="text-[#0070ea] text-sm font-medium hover:underline">
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Products grid */}
            {!loadingProds && !errorProds && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={cart.addItem}
                    onToggleWishlist={wishlist.toggle}
                    isWishlisted={wishlist.isWishlisted(product.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loadingProds && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-[#e5e8ee] text-sm font-medium text-[#43474f] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-[#0070ea] text-white'
                        : 'border border-[#e5e8ee] text-[#43474f] hover:bg-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="px-4 py-2 rounded-xl border border-[#e5e8ee] text-sm font-medium text-[#43474f] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
