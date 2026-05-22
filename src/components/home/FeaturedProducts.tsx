import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { featuredProducts } from '../../data/products';
import { ProductCard } from '../products/ProductCard';

export function FeaturedProducts() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2"
            >
              Mais vendidos
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-black text-gray-900"
            >
              Produtos em Destaque
            </motion.h2>
          </div>
          <Link
            to="/produtos"
            className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors group"
          >
            Ver todos
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link
            to="/produtos"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold"
          >
            Ver todos os produtos
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
