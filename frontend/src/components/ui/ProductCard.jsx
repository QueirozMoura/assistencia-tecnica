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
  const price         = Number(p.preco  ?? p.price         ?? 0)
  const originalPrice = p.precoPromocional != null
    ? Number(p.precoPromocional)
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
    <article className="bg-white rounded-2xl overflow-hidden premium-shadow flex flex-col group border border-transparent hover:border-[#cce0ff] transition-all duration-300">
      {/* Image */}
      <div className="relative h-52 bg-[#f1f4f9] overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-[#003366]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onToggleWishlist && onToggleWishlist(raw)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${
              isWishlisted
                ? 'bg-[#0070ea] text-white'
                : 'bg-white text-[#43474f] hover:bg-[#0070ea] hover:text-white'
            }`}
            aria-label={isWishlisted ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
            title={isWishlisted ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
          >
            <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
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
      <div className="p-4 flex flex-col flex-1">
        {product.brand && (
          <p className="text-xs font-semibold text-[#0070ea] mb-1">{product.brand}</p>
        )}
        <Link to={`/produto/${product.slug}`}>
          <h3 className="font-semibold text-[#181c20] text-sm leading-snug line-clamp-2 hover:text-[#0070ea] transition-colors mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating — só renderiza se o campo existir */}
        {product.rating != null && (
          <div className="flex items-center gap-1.5 mb-3">
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
        <div className="mt-auto">
          {product.originalPrice != null && product.originalPrice > product.price && (
            <p className="text-xs text-[#737780] line-through">
              {formatPrice(product.originalPrice)}
            </p>
          )}
          <p className="text-xl font-bold text-[#003366]">{formatPrice(product.price)}</p>

          {/* Parcelamento — só renderiza se o campo existir */}
          {product.installments != null && product.installments > 1 && (
            <p className="text-xs text-[#43474f] mt-0.5">
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
          disabled={!product.inStock}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            product.inStock
              ? 'bg-[#0070ea] text-white hover:bg-[#0059bb] active:scale-95'
              : 'bg-[#e5e8ee] text-[#737780] cursor-not-allowed'
          }`}
        >
          <ShoppingCart size={15} />
          {product.inStock ? 'Adicionar ao Carrinho' : 'Indisponível'}
        </button>
      </div>
    </article>
  )
}
