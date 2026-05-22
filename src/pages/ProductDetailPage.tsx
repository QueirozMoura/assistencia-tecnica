import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart, Zap, ChevronRight, Shield, Truck, RotateCcw,
  Star, Check, ChevronLeft, ChevronDown, ChevronUp, Heart, Share2,
  Package, Award
} from 'lucide-react';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { useCartStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { StarRating } from '../components/ui/StarRating';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/products/ProductCard';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useProduct(id!);
  const related = useRelatedProducts(product!, 4);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');

  const { addItem, toggleCart } = useCartStore();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h2>
          <Link to="/produtos" className="text-blue-600 hover:underline">Ver todos os produtos</Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) addItem(product);
    navigate('/checkout');
  };

  const displayedSpecs = showAllSpecs ? product.specs : product.specs.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">Início</Link>
            <ChevronRight size={14} />
            <Link to="/produtos" className="hover:text-blue-600 transition-colors">Produtos</Link>
            <ChevronRight size={14} />
            <Link
              to={`/produtos?categoria=${product.category}`}
              className="hover:text-blue-600 transition-colors capitalize"
            >
              {product.category.replace(/-/g, ' ')}
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate max-w-48">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Main product section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-card mb-4">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-80 md:h-[450px] object-cover"
                />
              </AnimatePresence>

              {/* Image navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => Math.min(product.images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Badges */}
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <Badge color={product.badge === 'NOVO' ? 'blue' : 'red'} size="md">
                    {product.badge}
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-blue-600 shadow-lg shadow-blue-200' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <span className="text-blue-600 font-bold text-sm">{product.brand}</span>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mt-1">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors text-gray-500">
                  <Heart size={18} />
                </button>
                <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-500">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating} showValue size={16} />
              <span className="text-sm text-gray-500">{product.reviewCount} avaliações</span>
              {product.inStock ? (
                <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                  <Check size={14} />
                  Em estoque
                </span>
              ) : (
                <span className="text-red-500 text-sm font-semibold">Esgotado</span>
              )}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-5 mb-6">
              {product.originalPrice && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 line-through text-sm">
                    {formatCurrency(product.originalPrice)}
                  </span>
                  {discount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                      -{discount}% OFF
                    </span>
                  )}
                </div>
              )}
              <div className="text-4xl font-black text-gray-900">
                {formatCurrency(product.price)}
              </div>
              <p className="text-blue-600 text-sm font-semibold mt-1">
                Em até {product.installments}x de {formatCurrency(product.installmentValue)} sem juros
              </p>
              <p className="text-gray-500 text-xs mt-2">
                À vista no Pix com 5% de desconto:{' '}
                <span className="font-bold text-emerald-600">
                  {formatCurrency(product.price * 0.95)}
                </span>
              </p>
            </div>

            {/* Short description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.shortDescription}</p>

            {/* Top features */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {product.features.slice(0, 4).map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={11} className="text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Quantidade:</span>
              <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors font-bold"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors font-bold"
                >
                  +
                </button>
              </div>
              {product.stockCount && product.stockCount <= 10 && (
                <span className="text-xs text-orange-500 font-semibold">
                  Últimas {product.stockCount} unidades!
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                size="lg"
                variant="outline"
                fullWidth
                icon={<ShoppingCart size={18} />}
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                Adicionar ao Carrinho
              </Button>
              <Button
                size="lg"
                fullWidth
                icon={<Zap size={18} fill="white" />}
                onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                Comprar Agora
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: 'Compra Segura', sub: 'SSL Certificado' },
                { icon: Truck, label: 'Frete Grátis', sub: 'Acima de R$ 2k' },
                { icon: RotateCcw, label: '30 dias', sub: 'Para troca' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-2xl">
                  <Icon size={18} className="text-blue-600 mb-1.5" />
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400">{sub}</span>
                </div>
              ))}
            </div>

            {/* Warranty */}
            <div className="mt-4 flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Award size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Garantia</p>
                <p className="text-xs text-emerald-700 mt-0.5">{product.warranty}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-card overflow-hidden mb-16">
          {/* Tab header */}
          <div className="flex border-b border-gray-100">
            {(['description', 'specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
                  activeTab === tab
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'description' && 'Descrição'}
                {tab === 'specs' && 'Especificações'}
                {tab === 'reviews' && `Avaliações (${product.reviews.length})`}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
                  <h3 className="font-bold text-gray-900 mb-4">Recursos e Funcionalidades</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={11} className="text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  key="specs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="divide-y divide-gray-100">
                    {displayedSpecs.map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-4">
                        <span className="text-sm text-gray-500 font-medium">{label}</span>
                        <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{value}</span>
                      </div>
                    ))}
                  </div>
                  {product.specs.length > 4 && (
                    <button
                      onClick={() => setShowAllSpecs(!showAllSpecs)}
                      className="flex items-center gap-2 mt-4 text-sm text-blue-600 font-semibold hover:underline"
                    >
                      {showAllSpecs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showAllSpecs ? 'Mostrar menos' : `Ver todas as ${product.specs.length} especificações`}
                    </button>
                  )}
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Rating summary */}
                  <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-2xl mb-8">
                    <div className="text-center">
                      <div className="text-5xl font-black text-gray-900">{product.rating}</div>
                      <StarRating rating={product.rating} size={16} />
                      <p className="text-xs text-gray-500 mt-1">{product.reviewCount} avaliações</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-3">{star}</span>
                          <Star size={12} className="text-yellow-400" fill="#facc15" />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{
                                width: star === 5 ? '70%' : star === 4 ? '20%' : '10%',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews list */}
                  {product.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {product.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm">{review.author}</span>
                                {review.verified && (
                                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Check size={10} />
                                    Compra verificada
                                  </span>
                                )}
                              </div>
                              <StarRating rating={review.rating} size={13} />
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(review.date)}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package size={40} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500">Seja o primeiro a avaliar este produto!</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-8">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
