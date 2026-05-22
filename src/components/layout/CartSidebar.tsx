import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';

export function CartSidebar() {
  const {
    items, isOpen, toggleCart, removeItem, updateQuantity,
    getTotalPrice, getTotalItems, appliedCoupon, discount,
  } = useCartStore();
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = getTotalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={toggleCart}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <ShoppingBag size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Carrinho</h2>
                  <p className="text-xs text-gray-500">{getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <button
                onClick={toggleCart}
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-64 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingBag size={32} className="text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">Carrinho vazio</h3>
                  <p className="text-sm text-gray-400 mb-6">Adicione produtos para continuar</p>
                  <Button size="sm" onClick={toggleCart}>
                    Explorar produtos
                  </Button>
                </motion.div>
              ) : (
                <>
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-3 bg-gray-50 rounded-2xl"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-semibold">{item.product.brand}</p>
                        <p className="text-sm font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-base font-bold text-blue-700 mt-2">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-blue-100 flex items-center justify-center transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                {/* Coupon display */}
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-sm bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-2 text-green-700 font-medium">
                      <Tag size={14} />
                      Cupom {appliedCoupon}
                    </span>
                    <span className="text-green-700 font-bold">-{discount}%</span>
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-blue-700">{formatCurrency(total)}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    ou em até 12x de {formatCurrency(total / 12)}
                  </p>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                  onClick={() => {
                    toggleCart();
                    navigate('/checkout');
                  }}
                >
                  Finalizar Compra
                </Button>

                <Link
                  to="/carrinho"
                  className="block text-center text-sm text-blue-600 hover:underline"
                  onClick={toggleCart}
                >
                  Ver carrinho completo
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
