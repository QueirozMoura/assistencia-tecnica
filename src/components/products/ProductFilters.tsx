import React from 'react';
import { motion } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';
import { useFilterStore } from '../../store/useStore';
import { categoryLabels, brands } from '../../data/products';
import { formatCurrency } from '../../utils/formatters';
import { StarRating } from '../ui/StarRating';

interface ProductFiltersProps {
  onClose?: () => void;
}

export function ProductFilters({ onClose }: ProductFiltersProps) {
  const {
    filters,
    setCategory,
    toggleBrand,
    setPriceRange,
    setRating,
    toggleInStockOnly,
    resetFilters,
  } = useFilterStore();

  const categories = [
    { slug: 'all', label: 'Todos os produtos' },
    ...Object.entries(categoryLabels).map(([slug, label]) => ({ slug, label })),
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-900">Filtros</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetFilters}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Limpar
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Categoria</h4>
        <div className="space-y-1">
          {categories.map(({ slug, label }) => (
            <button
              key={slug}
              onClick={() => setCategory(slug as typeof filters.category)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                filters.category === slug
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Marcas</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${
                filters.brand.includes(brand)
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 group-hover:border-blue-400'
              }`}>
                {filters.brand.includes(brand) && (
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={filters.brand.includes(brand)}
                onChange={() => toggleBrand(brand)}
              />
              <span className="text-sm text-gray-600">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Faixa de Preço</h4>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{formatCurrency(filters.priceRange[0])}</span>
          <span>{formatCurrency(filters.priceRange[1])}</span>
        </div>
        <input
          type="range"
          min={0}
          max={15000}
          step={100}
          value={filters.priceRange[1]}
          onChange={(e) => setPriceRange([filters.priceRange[0], Number(e.target.value)])}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(filters.priceRange[1] / 15000) * 100}%, #e5e7eb ${(filters.priceRange[1] / 15000) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex gap-3 mt-3">
          {[2000, 5000, 10000].map((max) => (
            <button
              key={max}
              onClick={() => setPriceRange([0, max])}
              className={`flex-1 text-xs py-1.5 rounded-xl font-medium transition-all ${
                filters.priceRange[1] === max
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Até {formatCurrency(max)}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Avaliação Mínima</h4>
        <div className="space-y-2">
          {[4, 3, null].map((rating) => (
            <button
              key={rating ?? 'all'}
              onClick={() => setRating(rating)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                filters.rating === rating
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              {rating ? (
                <div className="flex items-center gap-2">
                  <StarRating rating={rating} size={14} />
                  <span className="text-gray-600">ou mais</span>
                </div>
              ) : (
                <span className="text-gray-600">Todas as avaliações</span>
              )}
              {filters.rating === rating && (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* In stock only */}
      <div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-semibold text-gray-700">Apenas em estoque</span>
          <div
            onClick={toggleInStockOnly}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
              filters.inStockOnly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <motion.div
              animate={{ x: filters.inStockOnly ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
