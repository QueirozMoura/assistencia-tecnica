import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product } from '../../types';
import { useCartStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/formatters';
import { StarRating } from '../ui/StarRating';
import { Badge } from '../ui/Badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, toggleCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toggleCart();
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col"
    >
      {/* Image area */}
      <Link to={`/produto/${product.id}`} className="block relative overflow-hidden">
        <div className="relative h-52 bg-gray-50">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <Badge color={product.badge === 'NOVO' ? 'blue' : 'red'}>
                {product.badge}
              </Badge>
            )}
            {!product.inStock && (
              <Badge color="gray">Esgotado</Badge>
            )}
            {product.inStock && product.stockCount && product.stockCount <= 5 && (
              <Badge color="orange">Últimas {product.stockCount} un.</Badge>
            )}
          </div>

          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
              title="Adicionar aos favoritos"
            >
              <Heart size={16} />
            </motion.button>
            <Link
              to={`/produto/${product.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 rounded-xl bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
              title="Ver detalhes"
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/produto/${product.id}`} className="flex-1">
          <p className="text-xs text-blue-600 font-semibold mb-1">{product.brand}</p>
          <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{product.shortDescription}</p>

          {/* Rating */}
          <div className="mb-3">
            <StarRating
              rating={product.rating}
              showValue
              reviewCount={product.reviewCount}
            />
          </div>

          {/* Pricing */}
          <div className="mt-auto">
            {product.originalPrice && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
                {discount > 0 && (
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-lg">
                    -{discount}%
                  </span>
                )}
              </div>
            )}
            <div className="text-xl font-black text-gray-900">
              {formatCurrency(product.price)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              ou {product.installments}x de{' '}
              <span className="font-semibold text-blue-600">
                {formatCurrency(product.installmentValue)}
              </span>
              {' '}sem juros
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={15} />
            Carrinho
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBuyNow}
            disabled={!product.inStock}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-xl py-2.5 transition-all shadow-md shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={15} fill="white" />
            Comprar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
