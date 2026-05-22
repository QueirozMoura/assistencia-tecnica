import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Grid3X3, List, ChevronDown, X } from 'lucide-react';
import { useFilterStore } from '../store/useStore';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/products/ProductCard';
import { ProductFilters } from '../components/products/ProductFilters';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { categoryLabels } from '../data/products';
import { ProductCategory } from '../types';

const sortOptions = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'rating', label: 'Melhor avaliados' },
  { value: 'newest', label: 'Mais novos' },
];

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const { filters, setCategory, setSortBy } = useFilterStore();
  const products = useProducts(filters);

  // Sync URL params with filter store
  useEffect(() => {
    const categoria = searchParams.get('categoria');
    if (categoria && categoria !== filters.category) {
      setCategory((categoria as ProductCategory) || 'all');
    } else if (!categoria && filters.category !== 'all') {
      // only reset if no categoria param
    }
  }, [searchParams]);

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [filters]);

  const currentCategoryLabel =
    filters.category === 'all'
      ? 'Todos os Produtos'
      : categoryLabels[filters.category] || 'Produtos';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-black text-white mb-2"
          >
            {currentCategoryLabel}
          </motion.h1>
          <p className="text-blue-200 text-sm">
            {loading ? '...' : `${products.length} produtos encontrados`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category quick filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {[
            { slug: 'all', label: 'Todos' },
            ...Object.entries(categoryLabels).map(([slug, label]) => ({ slug, label })),
          ].map(({ slug, label }) => (
            <button
              key={slug}
              onClick={() => setCategory(slug as typeof filters.category)}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                filters.category === slug
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters - desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 bg-white rounded-2xl px-4 py-3 shadow-sm">
              {/* Mobile filter button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
              >
                <SlidersHorizontal size={16} />
                Filtros
              </button>

              <div className="flex items-center gap-3 ml-auto">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof filters.sortBy)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm font-medium bg-gray-100 rounded-xl outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                {/* View mode */}
                <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Products grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Tente ajustar os filtros para encontrar o que procura.
                </p>
              </motion.div>
            ) : (
              <motion.div
                layout
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters overlay */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 bg-gray-50 z-50 overflow-y-auto p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900">Filtros</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <ProductFilters onClose={() => setShowMobileFilters(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
