import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag,
  Shield, Truck, RotateCcw, X
} from 'lucide-react';
import { useCartStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { StarRating } from '../components/ui/StarRating';

export function CartPage() {
  const {
    items, removeItem, updateQuantity, clearCart,
    getTotalPrice, getTotalItems, appliedCoupon, discount,
    applyCoupon, removeCoupon
  } = useCartStore();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const shipping = subtotal >= 2000 ? 0 : 199.90;
  const total = getTotalPrice() + shipping;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const success = applyCoupon(couponInput.trim());
    if (success) {
      toast.success(`Cupom ${couponInput.toUpperCase()} aplicado!`);
      setCouponError('');
      setCouponInput('');
    } else {
      setCouponError('Cupom inválido ou expirado.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-28 h-28 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={48} className="text-blue-200" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-8">
            Explore nossa seleção premium de eletrodomésticos e encontre o produto perfeito para o seu lar.
          </p>
          <Link to="/produtos">
            <Button size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Explorar Produtos
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            Meu Carrinho
            <span className="ml-3 text-base font-semibold text-gray-400">
              ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'})
            </span>
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors"
          >
            Limpar carrinho
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-3xl p-5 shadow-card flex gap-4"
                >
                  <Link to={`/produto/${item.product.id}`} className="flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-blue-600 text-xs font-semibold">{item.product.brand}</p>
                        <Link to={`/produto/${item.product.id}`}>
                          <h3 className="font-bold text-gray-900 mt-0.5 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
                            {item.product.name}
                          </h3>
                        </Link>
                        <StarRating rating={item.product.rating} reviewCount={item.product.reviewCount} />
                        <p className="text-xs text-gray-400 mt-1 hidden md:block">
                          {item.product.shortDescription}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.product.id);
                          toast('Item removido do carrinho', { icon: '🗑️' });
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.product.originalPrice && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatCurrency(item.product.originalPrice * item.quantity)}
                          </p>
                        )}
                        <p className="text-xl font-black text-gray-900">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                        <p className="text-xs text-blue-500">
                          {formatCurrency(item.product.price)} / un.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Continue shopping */}
            <Link
              to="/produtos"
              className="flex items-center gap-2 text-blue-600 font-semibold text-sm mt-2 hover:underline"
            >
              ← Continuar comprando
            </Link>
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-3xl p-5 shadow-card">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-blue-600" />
                Cupom de Desconto
              </h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-bold text-green-700">{appliedCoupon}</p>
                    <p className="text-xs text-green-600">{discount}% de desconto aplicado</p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Digite o cupom"
                      className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-300 border border-transparent"
                    />
                    <Button size="sm" onClick={handleApplyCoupon}>
                      Aplicar
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-500 mt-2">{couponError}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Experimente: JFQ10, PROMO15, FIRST20
                  </p>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-3xl p-5 shadow-card">
              <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({getTotalItems()} itens)</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Desconto cupom</span>
                    <span className="text-green-600 font-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Frete</span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-semibold">Grátis</span>
                  ) : (
                    <span className="font-medium">{formatCurrency(shipping)}</span>
                  )}
                </div>
                {subtotal > 0 && subtotal < 2000 && (
                  <div className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">
                    Faltam {formatCurrency(2000 - subtotal)} para frete grátis!
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-900">{formatCurrency(total)}</div>
                    <p className="text-xs text-gray-500">12x de {formatCurrency(total / 12)} sem juros</p>
                  </div>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                icon={<ArrowRight size={18} />}
                iconPosition="right"
                onClick={() => navigate('/checkout')}
              >
                Finalizar Compra
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <Shield size={12} className="text-blue-400" />
                Compra 100% segura
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 rounded-3xl p-5 space-y-3">
              {[
                { icon: Truck, text: 'Frete grátis acima de R$ 2.000' },
                { icon: RotateCcw, text: '30 dias para troca ou devolução' },
                { icon: Shield, text: 'Garantia estendida JFQ' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-blue-700">
                  <Icon size={14} className="text-blue-500 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
