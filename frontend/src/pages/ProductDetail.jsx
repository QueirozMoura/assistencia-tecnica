import { useState, useEffect } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import {
  Star, ShoppingCart, Heart, Shield, Truck, RotateCcw,
  CheckCircle, ChevronRight, Minus, Plus, ArrowLeft, AlertCircle,
} from 'lucide-react'
import ProductCard from '../components/ui/ProductCard'
import { getProdutoBySlug, getProdutosRelacionados } from '../services/api'
import { getPrimaryImage, getGallery } from '../services/imageMap'
import { formatPrice } from '../utils/formatPrice'

// ── Skeleton de loading ────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="bg-[#f7f9ff] min-h-screen animate-pulse">
      <div className="bg-white border-b border-[#e5e8ee] h-10" />
      <div className="container-max py-8">
        <div className="h-4 w-24 bg-[#e5e8ee] rounded mb-6" />
        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          <div className="bg-[#e5e8ee] rounded-2xl aspect-square" />
          <div className="space-y-4">
            <div className="h-4 w-1/4 bg-[#e5e8ee] rounded" />
            <div className="h-7 w-3/4 bg-[#e5e8ee] rounded" />
            <div className="h-4 w-1/3 bg-[#e5e8ee] rounded" />
            <div className="h-24 bg-[#e5e8ee] rounded-xl" />
            <div className="h-12 bg-[#e5e8ee] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { cart, wishlist } = useOutletContext()

  const [qty, setQty]             = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [activeTab, setActiveTab] = useState('desc')

  // ── Estado da API ──────────────────────────────────────────
  const [product, setProduct]   = useState(null)
  const [related, setRelated]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    setActiveImg(0)
    setQty(1)

    getProdutoBySlug(slug)
      .then((res) => {
        setProduct(res.data)
        // Buscar relacionados em paralelo — falha silenciosa
        return getProdutosRelacionados(res.data.id, 4)
          .then((rel) => setRelated(rel.data))
          .catch(() => setRelated([]))
      })
      .catch((err) => {
        setError(err.status === 404 ? 'not_found' : err.message)
      })
      .finally(() => setLoading(false))
  }, [slug])

  // ── Loading ────────────────────────────────────────────────
  if (loading) return <DetailSkeleton />

  // ── Produto não encontrado ─────────────────────────────────
  if (error === 'not_found' || (!loading && !product)) {
    return (
      <div className="container-max py-20 text-center">
        <h2 className="text-xl font-bold text-[#003366] mb-4">Produto não encontrado</h2>
        <Link to="/catalogo" className="text-[#0070ea] hover:underline">Voltar ao catálogo</Link>
      </div>
    )
  }

  // ── Erro genérico ──────────────────────────────────────────
  if (error) {
    return (
      <div className="container-max py-20 text-center">
        <AlertCircle size={40} className="text-[#ba1a1a] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#003366] mb-2">Erro ao carregar produto</h2>
        <p className="text-sm text-[#737780] mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#0070ea] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0059bb] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // ── Normalização de campos API → UI ───────────────────────
  const nome          = product.nome          ?? ''
  const descricao     = product.descricao     ?? ''
  const preco         = Number(product.preco  ?? 0)
  const precoPromo    = product.precoPromocional != null ? Number(product.precoPromocional) : null
  // imageMap: banco → mapeamento local → fallback categoria → null
  const imagemPrinc   = getPrimaryImage(product) ?? ''
  const imagens       = getGallery(product).length > 0
    ? getGallery(product)
    : (imagemPrinc ? [imagemPrinc] : [])
  const inStock       = product.estoque > 0 && product.ativo !== false
  const categoria     = product.categoria ?? {}

  // Campos opcionais (Fase 2 — ainda não no schema)
  const marca         = product.marca         ?? categoria.nome ?? ''
  const avaliacao     = product.avaliacao     ?? null
  const totalAval     = product.totalAvaliacoes ?? null
  const parcelas      = product.parcelas      ?? null
  const features      = product.caracteristicas ?? []
  const specs         = product.especificacoes  ?? null   // JSON ou null

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e5e8ee]">
        <div className="container-max py-3">
          <nav className="flex items-center gap-1.5 text-xs text-[#737780]">
            <Link to="/" className="hover:text-[#0070ea] transition-colors">Início</Link>
            <ChevronRight size={12} />
            <Link to="/catalogo" className="hover:text-[#0070ea] transition-colors">Catálogo</Link>
            {categoria.slug && (
              <>
                <ChevronRight size={12} />
                <Link
                  to={`/catalogo?categoria=${categoria.slug}`}
                  className="hover:text-[#0070ea] transition-colors"
                >
                  {categoria.nome}
                </Link>
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-[#181c20] font-medium line-clamp-1">{nome}</span>
          </nav>
        </div>
      </div>

      <div className="container-max py-8">
        {/* Back */}
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1.5 text-sm text-[#43474f] hover:text-[#0070ea] transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Voltar ao catálogo
        </Link>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          {/* Gallery */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden border border-[#e5e8ee] mb-3 aspect-square">
              {imagens.length > 0 ? (
                <img
                  src={imagens[activeImg]}
                  alt={nome}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#f1f4f9]">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="72" height="72" rx="12" fill="#e5e8ee"/>
                    <path d="M18 54l14-18 10 12 7-9 11 15H18z" fill="#c3c6d1"/>
                    <circle cx="50" cy="24" r="7" fill="#c3c6d1"/>
                  </svg>
                  <span className="text-[#c3c6d1] text-sm font-medium">Imagem não disponível</span>
                </div>
              )}
            </div>
            {imagens.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imagens.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Ver imagem ${i + 1} de ${imagens.length}`}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      i === activeImg ? 'border-[#0070ea]' : 'border-[#e5e8ee]'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${nome} — foto ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {marca && (
              <p className="text-sm font-semibold text-[#0070ea] mb-1">{marca}</p>
            )}
            <h1 className="text-2xl font-bold text-[#003366] leading-tight mb-3">{nome}</h1>

            {/* Rating — só exibe se existir no banco */}
            {avaliacao != null && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= Math.round(avaliacao) ? 'text-amber-400' : 'text-[#c3c6d1]'}
                      fill={s <= Math.round(avaliacao) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#181c20]">{avaliacao}</span>
                {totalAval != null && (
                  <span className="text-sm text-[#737780]">({totalAval} avaliações)</span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="bg-[#f7f9ff] rounded-xl p-4 mb-5">
              {precoPromo != null && precoPromo < preco && (
                <p className="text-sm text-[#737780] line-through">{formatPrice(preco)}</p>
              )}
              <p className="text-3xl font-bold text-[#003366]">
                {formatPrice(precoPromo != null && precoPromo < preco ? precoPromo : preco)}
              </p>
              {parcelas != null && parcelas > 1 && (
                <p className="text-sm text-[#43474f] mt-1">
                  Em até{' '}
                  <span className="font-bold text-[#0070ea]">{parcelas}x</span> de{' '}
                  <span className="font-bold text-[#0070ea]">
                    {formatPrice((precoPromo ?? preco) / parcelas)}
                  </span>{' '}
                  sem juros
                </p>
              )}
              <p className="text-xs text-[#1a6b3c] font-medium mt-1">
                À vista: {formatPrice((precoPromo ?? preco) * 0.95)} (5% de desconto)
              </p>
            </div>

            {/* Features — só exibe se existir no banco */}
            {features.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-[#181c20] mb-2">Principais características:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#43474f]">
                      <CheckCircle size={14} className="text-[#0070ea] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-[#e5e8ee] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5 text-[#43474f] hover:bg-[#f1f4f9] transition-colors"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={15} />
                </button>
                <span className="px-4 py-2.5 text-sm font-semibold text-[#181c20] min-w-[2.5rem] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2.5 text-[#43474f] hover:bg-[#f1f4f9] transition-colors"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={15} />
                </button>
              </div>
              <button
                onClick={() => inStock && cart.addItem && cart.addItem({ ...product, qty })}
                disabled={!inStock}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                  inStock
                    ? 'bg-[#0070ea] text-white hover:bg-[#0059bb] active:scale-95'
                    : 'bg-[#e5e8ee] text-[#737780] cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={18} />
                {inStock ? 'Adicionar ao Carrinho' : 'Indisponível'}
              </button>
              <button
                onClick={() => wishlist.toggle && wishlist.toggle(product)}
                aria-label={wishlist.isWishlisted(product.id) ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
                className={`p-3 rounded-xl border transition-all ${
                  wishlist.isWishlisted(product.id)
                    ? 'border-[#0070ea] bg-[#cce0ff] text-[#0070ea]'
                    : 'border-[#e5e8ee] text-[#43474f] hover:border-[#0070ea]'
                }`}
              >
                <Heart size={18} fill={wishlist.isWishlisted(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield,   title: '12 meses',    sub: 'Garantia' },
                { icon: Truck,    title: 'Frete Grátis', sub: 'Acima de R$ 299' },
                { icon: RotateCcw, title: '7 dias',     sub: 'Troca fácil' },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="bg-[#f7f9ff] rounded-xl p-3 text-center border border-[#e5e8ee]">
                  <Icon size={18} className="text-[#0070ea] mx-auto mb-1" />
                  <p className="text-xs font-semibold text-[#181c20]">{title}</p>
                  <p className="text-xs text-[#737780]">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] overflow-hidden mb-10">
          <div className="flex border-b border-[#e5e8ee]">
            {[
              { id: 'desc',  label: 'Descrição' },
              ...(specs ? [{ id: 'specs', label: 'Especificações' }] : []),
              ...(avaliacao != null ? [{ id: 'reviews', label: `Avaliações${totalAval ? ` (${totalAval})` : ''}` }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#0070ea] text-[#0070ea]'
                    : 'border-transparent text-[#43474f] hover:text-[#181c20]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'desc' && (
              <p className="text-[#43474f] leading-relaxed whitespace-pre-line">
                {descricao || 'Descrição não disponível.'}
              </p>
            )}

            {activeTab === 'specs' && specs && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(specs).map(([key, val], i) => (
                      <tr key={key} className={i % 2 === 0 ? 'bg-[#f7f9ff]' : 'bg-white'}>
                        <td className="py-3 px-4 font-medium text-[#43474f] w-1/3">{key}</td>
                        <td className="py-3 px-4 text-[#181c20]">{String(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && avaliacao != null && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-[#f7f9ff] rounded-xl">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[#003366]">{avaliacao}</p>
                    <div className="flex gap-0.5 justify-center my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= Math.round(avaliacao) ? 'text-amber-400' : 'text-[#c3c6d1]'}
                          fill={s <= Math.round(avaliacao) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    {totalAval != null && (
                      <p className="text-xs text-[#737780]">{totalAval} avaliações</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-xs text-[#737780] w-4">{s}</span>
                        <div className="flex-1 bg-[#e5e8ee] rounded-full h-2">
                          <div
                            className="bg-amber-400 h-2 rounded-full"
                            style={{ width: `${s === 5 ? 70 : s === 4 ? 20 : s === 3 ? 7 : 2}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#737780] text-center">
                  Avaliações verificadas de clientes que compraram este produto.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-[#003366] mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={cart.addItem}
                  onToggleWishlist={wishlist.toggle}
                  isWishlisted={wishlist.isWishlisted(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
