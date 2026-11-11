import { Link } from 'react-router-dom'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import { formatPrice, calcDiscount } from '../../utils/formatPrice'
import { getPrimaryImage } from '../../services/imageMap'

const badgeColors = {
  secondary: 'bg-[#cce0ff] text-[#003366]',
  error:     'bg-[#ffdad6] text-[#ba1a1a]',
  primary:   'bg-[#003366] text-white',
  success:   'bg-[#d4f5e2] text-[#1a6b3c]',
}

/**
 * Normaliza um produto vindo da API (campos em português)
 * para o contrato interno usado pelo card.
 *
 * Campos da API  →  alias interno
 *   nome         →  name
 *   descricao    →  description
 *   preco        →  price
 *   precoPromocional → originalPrice
 *   imagemPrincipal  → image
 *   estoque / ativo  → inStock
 *   categoria.nome   → brand  (fallback enquanto `marca` não existe no schema)
 */
function normalize(p) {
  // Suporte a ambos os formatos: API (pt) e mock local (en)
  const name          = p.nome          ?? p.name          ?? ''
  const description   = p.descricao     ?? p.description   ?? ''
  const price         = Number(p.precoPromocional ?? p.preco ?? p.price ?? 0)
  const originalPrice = p.precoPromocional != null
    ? Number(p.preco)
    : p.originalPrice != null
      ? Number(p.originalPrice)
      : null
  // getPrimaryImage: banco → mapeamento local → fallback categoria → null
  const image         = getPrimaryImage(p) ?? p.image ?? ''
  const inStock       = p.estoque != null
    ? p.estoque > 0 && (p.ativo !== false)
    : (p.inStock ?? true)

  // `marca` ainda não existe no schema — usa categoria.nome como fallback
  const brand         = p.marca ?? p.brand ?? p.categoria?.nome ?? ''

  // Campos opcionais que existem no mock mas não no schema ainda
  const rating        = p.avaliacao     ?? p.rating        ?? null
  const reviewCount   = p.totalAvaliacoes ?? p.reviewCount ?? null
  const installments  = p.parcelas      ?? p.installments  ?? null
  const badge         = p.badge         ?? null
  const badgeColor    = p.badgeColor    ?? null

  return {
    ...p,
    name,
    description,
    price,
    originalPrice,
    image,
    inStock,
    brand,
    rating,
    reviewCount,
    installments,
    badge,
    badgeColor,
  }
}

export default function ProductCard({ product: raw, onAddToCart, onToggleWishlist, isWishlisted }) {
  const product  = normalize(raw)
  const discount = product.originalPrice
    ? calcDiscount(product.originalPrice, product.price)
    : null

  return (
    <article className="bg-white rounded-2xl overflow-hidden flex flex-col h-full group border border-[#e5e8ee] shadow-[0_1px_3px_rgba(0,51,102,0.06)] hover:border-[#b7d2f8] hover:shadow-[0_12px_28px_-14px_rgba(0,51,102,0.28)] transition-[border-color,box-shadow] duration-300">
      {/* Image */}
      <div className="relative aspect-square sm:aspect-[4/3] bg-[#f5f7fb] overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#c3c6d1]">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="8" fill="#e5e8ee"/>
              <path d="M14 34l8-10 6 7 4-5 6 8H14z" fill="#c3c6d1"/>
              <circle cx="32" cy="18" r="4" fill="#c3c6d1"/>
            </svg>
            <span className="text-xs font-medium">Sem imagem</span>
          </div>
        )}

        {/* Wishlist (always visible, works on touch) */}
        <button
          onClick={() => onToggleWishlist && onToggleWishlist(raw)}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-sm border transition-colors focus-visible:outline-2 focus-visible:outline-[#0070ea] ${
            isWishlisted
              ? 'bg-[#0070ea] border-[#0070ea] text-white'
              : 'bg-white/95 border-[#e5e8ee] text-[#43474f] hover:text-[#0070ea] hover:border-[#0070ea]'
          }`}
          aria-label={isWishlisted ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
          aria-pressed={!!isWishlisted}
          title={isWishlisted ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColors[product.badgeColor] || badgeColors.secondary}`}>
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#ba1a1a] text-white">
              -{discount}%
            </span>
          )}
        </div>

        {/* Out of stock */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-[#43474f] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex flex-col flex-1">
        {product.brand && (
          <p className="text-xs font-medium text-[#0070ea] mb-1.5 truncate">{product.brand}</p>
        )}
        <Link to={`/produto/${product.slug}`} className="focus-visible:outline-2 focus-visible:outline-[#0070ea] rounded">
          <h3 className="font-semibold text-[#181c20] text-sm sm:text-[15px] leading-snug line-clamp-2 min-h-[2.6em] hover:text-[#0070ea] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating — só renderiza se o campo existir */}
        {product.rating != null && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className={s <= Math.round(product.rating) ? 'text-amber-400' : 'text-[#c3c6d1]'}
                  fill={s <= Math.round(product.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            {product.reviewCount != null && (
              <span className="text-xs text-[#737780]">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-h-[2.75rem] sm:min-h-[2rem] content-end">
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#003366] leading-none">{formatPrice(product.price)}</p>
            {product.originalPrice != null && product.originalPrice > product.price && (
              <p className="text-xs text-[#737780] line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>

          {/* Parcelamento — só renderiza se o campo existir */}
          {product.installments != null && product.installments > 1 && (
            <p className="text-xs text-[#43474f] mt-1.5">
              Em até {product.installments}x de{' '}
              <span className="font-semibold text-[#0070ea]">
                {formatPrice(product.price / product.installments)}
              </span>{' '}
              sem juros
            </p>
          )}
        </div>

        {/* Button */}
        <button
          onClick={() => product.inStock && onAddToCart && onAddToCart(product)}
          aria-label={product.inStock ? `Adicionar ${product.name} ao carrinho` : undefined}
          disabled={!product.inStock}
          className={`mt-3 sm:mt-4 w-full flex items-center justify-center gap-1.5 sm:gap-2 h-11 rounded-xl text-[13px] sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070ea] ${
            product.inStock
              ? 'bg-[#0070ea] text-white hover:bg-[#0059bb] active:bg-[#004a9c]'
              : 'bg-[#e5e8ee] text-[#737780] cursor-not-allowed'
          }`}
        >
          <ShoppingCart size={16} />
          {product.inStock ? (
            <>
              <span className="sm:hidden">Adicionar</span>
              <span className="hidden sm:inline">Adicionar ao carrinho</span>
            </>
          ) : 'Indisponível'}
        </button>
      </div>
    </article>
  )
}
