import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, AlertCircle, ArrowUpDown } from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { getProdutos, getCategorias } from '../services/api'
import { useAsyncData } from '../hooks/useAsyncData'

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
    <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e8ee] flex flex-col h-full animate-pulse motion-reduce:animate-none" aria-hidden="true">
      <div className="aspect-square sm:aspect-[4/3] bg-[#eef1f6]" />
      <div className="p-3 sm:p-5 flex flex-col flex-1">
        <div className="h-3 bg-[#eef1f6] rounded w-1/3 mb-2" />
        <div className="h-3.5 bg-[#eef1f6] rounded w-11/12 mb-1.5" />
        <div className="h-3.5 bg-[#eef1f6] rounded w-2/3" />
        <div className="mt-auto pt-3 sm:pt-4">
          <div className="h-6 sm:h-7 bg-[#e3eaf5] rounded w-1/2" />
        </div>
        <div className="h-11 bg-[#e3eaf5] rounded-xl mt-3 sm:mt-4" />
      </div>
    </div>
  )
}

function FilterSection({ title, id, children, openSection, setOpenSection }) {
  return (
    <div className="border-b border-[#eef1f6] pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpenSection((s) => ({ ...s, [id]: !s[id] }))}
        aria-expanded={!!openSection[id]}
        className="flex items-center justify-between w-full text-sm font-semibold text-[#003366] mb-2.5 rounded-md hover:text-[#0070ea] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea]"
      >
        {title}
        {openSection[id] ? <ChevronUp size={15} className="text-[#737780]" /> : <ChevronDown size={15} className="text-[#737780]" />}
      </button>
      {openSection[id] && children}
    </div>
  )
}

export default function Catalog() {
  const { cart, wishlist } = useOutletContext()
  const [searchParams] = useSearchParams()

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
  const loadProducts = useCallback(async () => {

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

    const res = await getProdutos(params)
    return { products: res.data, meta: res.meta }
  }, [page, searchQuery, selectedCategories, selectedPriceRange, sortBy])
  const { data, loading: loadingProds, error: errorProds, reload: fetchProducts } = useAsyncData(loadProducts, { products: [], meta: { total: 0, totalPages: 1 } })
  const { products, meta } = data

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



  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Banner */}
      <div className="bg-[#003366] py-5 sm:py-7">
        <div className="container-max">
          <nav aria-label="Breadcrumb" className="text-xs text-[#9db6d6] mb-2 flex items-center gap-1.5">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white" aria-current="page">Catálogo</span>
          </nav>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold leading-tight text-white">
              {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo de Produtos'}
            </h1>
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#d6e6ff]">
              {loadingProds
                ? 'Carregando produtos...'
                : `${meta.total} produto${meta.total !== 1 ? 's' : ''} encontrado${meta.total !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="container-max py-6 sm:py-8">
        {/* Mobile filter toggle */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 lg:hidden">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            className="flex h-11 items-center justify-center gap-2 bg-white border border-[#d8dce5] px-3 rounded-xl text-sm font-medium text-[#003366] hover:border-[#0070ea] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea]"
          >
            <SlidersHorizontal size={16} />
            Filtros
            {hasFilters && <span className="w-2 h-2 bg-[#0070ea] rounded-full" />}
          </button>
          <div className="relative">
            <ArrowUpDown size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737780]" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
              aria-label="Ordenar produtos"
              className="h-11 w-full appearance-none bg-white border border-[#d8dce5] pl-9 pr-8 rounded-xl text-sm font-medium text-[#003366] outline-none hover:border-[#0070ea] focus-visible:border-[#0070ea] focus-visible:ring-2 focus-visible:ring-[#0070ea]/25 transition-colors"
            >
              <option value="relevancia">Relevância</option>
              <option value="menor-preco">Menor Preço</option>
              <option value="maior-preco">Maior Preço</option>
              <option value="nome">Nome A-Z</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737780]" />
          </div>
        </div>

        <div className="flex gap-8">
          {/* ── Sidebar ── */}
          <aside className={`w-full lg:w-64 lg:flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-2xl border border-[#e5e8ee] shadow-[0_1px_3px_rgba(0,51,102,0.06)] p-4 lg:sticky lg:top-[9.5rem] lg:max-h-[calc(100vh-10.5rem)] lg:overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#eef1f6]">
                <h2 className="font-bold text-[#003366]">Filtros</h2>
              </div>

              {/* Categorias */}
              <FilterSection openSection={openSection} setOpenSection={setOpenSection} title="Categoria" id="cat">
                {loadingCats ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-[#e5e8ee] rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {categorias.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 -mx-2 hover:bg-[#f5f9ff] has-[:checked]:bg-[#e8f1ff] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0070ea]/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.slug)}
                          onChange={() => toggleCategory(cat.slug)}
                          className="w-4 h-4 rounded border-[#c3c6d1] accent-[#0070ea] cursor-pointer"
                        />
                        <span className="text-sm text-[#43474f] group-hover:text-[#003366] group-has-[:checked]:text-[#003366] group-has-[:checked]:font-medium transition-colors">
                          {cat.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </FilterSection>

              {/* Faixa de Preço */}
              <FilterSection openSection={openSection} setOpenSection={setOpenSection} title="Faixa de Preço" id="price">
                <div className="space-y-0.5">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 -mx-2 hover:bg-[#f5f9ff] has-[:checked]:bg-[#e8f1ff] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0070ea]/40 transition-colors">
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceRange === range.label}
                        onChange={() => { setSelectedPriceRange(range.label); setPage(1) }}
                        className="w-4 h-4 border-[#c3c6d1] accent-[#0070ea] cursor-pointer"
                      />
                      <span className="text-sm text-[#43474f] group-hover:text-[#003366] group-has-[:checked]:text-[#003366] group-has-[:checked]:font-medium transition-colors">
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
            <div className="hidden lg:flex items-center justify-between mb-5 pb-4 border-b border-[#e5e8ee]">
              <p className="text-sm text-[#737780]">
                {loadingProds ? (
                  <span className="inline-block w-40 h-4 bg-[#e5e8ee] rounded animate-pulse" />
                ) : (
                  <>
                    Exibindo{' '}
                    <span className="font-semibold text-[#003366]">{products.length}</span> de{' '}
                    <span className="font-semibold text-[#003366]">{meta.total}</span> produtos
                  </>
                )}
              </p>
              <div className="flex items-center gap-2.5">
                <label htmlFor="catalog-sort" className="text-sm text-[#737780]">Ordenar por</label>
                <div className="relative">
                  <ArrowUpDown size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#737780]" />
                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
                    className="h-10 appearance-none bg-white border border-[#d8dce5] pl-9 pr-9 rounded-xl text-sm font-medium text-[#003366] outline-none hover:border-[#0070ea] focus-visible:border-[#0070ea] focus-visible:ring-2 focus-visible:ring-[#0070ea]/25 transition-colors cursor-pointer"
                  >
                    <option value="relevancia">Relevância</option>
                    <option value="menor-preco">Menor Preço</option>
                    <option value="maior-preco">Maior Preço</option>
                    <option value="nome">Nome A-Z</option>
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737780]" />
                </div>
              </div>
            </div>

            {/* Chips de filtros ativos */}
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-5" aria-label="Filtros ativos">
                {selectedCategories.map((slug) => {
                  const nome = categorias.find((c) => c.slug === slug)?.nome || slug
                  return (
                    <span
                      key={`cat-${slug}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#b7d2f8] bg-[#e8f1ff] pl-3 pr-1 py-1 text-xs font-medium text-[#003366]"
                    >
                      {nome}
                      <button
                        type="button"
                        onClick={() => toggleCategory(slug)}
                        aria-label={`Remover filtro ${nome}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[#003366] hover:bg-[#0070ea] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#0070ea]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
                {selectedPriceRange && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#b7d2f8] bg-[#e8f1ff] pl-3 pr-1 py-1 text-xs font-medium text-[#003366]">
                    {selectedPriceRange}
                    <button
                      type="button"
                      onClick={() => { setSelectedPriceRange(null); setPage(1) }}
                      aria-label={`Remover filtro ${selectedPriceRange}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[#003366] hover:bg-[#0070ea] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#0070ea]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1 text-xs font-medium text-[#737780] hover:text-[#0070ea] hover:underline transition-colors focus-visible:outline-2 focus-visible:outline-[#0070ea] rounded"
                >
                  Limpar filtros
                </button>
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
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5" role="status" aria-label="Carregando produtos">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingProds && !errorProds && products.length === 0 && (
              <div className="flex flex-col items-center text-center rounded-2xl border border-dashed border-[#c3d4ea] bg-white px-6 py-14 sm:py-20">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#e8f1ff] rounded-full flex items-center justify-center mb-4">
                  <Search size={24} className="text-[#0070ea]" />
                </div>
                <h3 className="text-lg font-bold text-[#003366] mb-1.5">
                  {searchQuery ? 'Nenhum resultado para a sua busca' : 'Nenhum produto encontrado'}
                </h3>
                <p className="text-sm text-[#43474f] max-w-sm mb-5">
                  {searchQuery
                    ? `Não encontramos produtos para "${searchQuery}"${hasFilters ? ' com os filtros selecionados' : ''}. Confira a grafia ou tente um termo mais simples.`
                    : hasFilters
                      ? 'Nenhum produto corresponde aos filtros selecionados. Remova algum filtro para ver mais opções.'
                      : 'Não há produtos disponíveis no momento. Volte em breve.'}
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {hasFilters && (
                    <button
                      onClick={clearAll}
                      className="h-11 px-6 rounded-xl bg-[#0070ea] text-white text-sm font-semibold hover:bg-[#0059bb] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea]"
                    >
                      Limpar filtros
                    </button>
                  )}
                  {searchQuery && (
                    <Link
                      to="/catalogo"
                      className="inline-flex h-11 items-center justify-center px-6 rounded-xl border border-[#c3d4ea] text-sm font-semibold text-[#003366] hover:border-[#0070ea] hover:text-[#0070ea] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea]"
                    >
                      Ver todos os produtos
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Products grid */}
            {!loadingProds && !errorProds && products.length > 0 && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
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
