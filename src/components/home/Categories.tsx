import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import geladeiraImage from '../../assets/images/WhatsApp Image 2026-05-22 at 23.16.16.jpeg';
import maquinaLavarImage from '../../assets/images/WhatsApp Image 2026-05-22 at 22.24.03 (1).jpeg';
import lavaSecaImage from '../../assets/images/WhatsApp Image 2026-05-22 at 22.24.03 (2).jpeg';
import secadoraImage from '../../assets/images/WhatsApp Image 2026-05-22 at 23.20.26.jpeg';
import microondasImage from '../../assets/images/WhatsApp Image 2026-05-22 at 23.12.15.jpeg';

const categories = [
  {
    slug: 'geladeira',
    label: 'Geladeiras',
    description: 'Side by side, French door e duplex',
    gradient: 'from-blue-500 to-cyan-400',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-100',
    image: geladeiraImage,
    count: 4,
  },
  {
    slug: 'maquina-de-lavar',
    label: 'Máquinas de Lavar',
    description: 'Eco Bubble, TurboWash e mais',
    gradient: 'from-indigo-500 to-blue-400',
    bgGradient: 'from-indigo-50 to-blue-50',
    borderColor: 'border-indigo-100',
    image: maquinaLavarImage,
    count: 7,
  },
  {
    slug: 'lava-e-seca',
    label: 'Lava e Seca',
    description: 'WashTower e All-in-One',
    gradient: 'from-purple-500 to-indigo-400',
    bgGradient: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-100',
    image: lavaSecaImage,
    count: 3,
  },
  {
    slug: 'secadora',
    label: 'Secadoras',
    description: 'Heat Pump e Perfect Care',
    gradient: 'from-orange-500 to-yellow-400',
    bgGradient: 'from-orange-50 to-yellow-50',
    borderColor: 'border-orange-100',
    image: secadoraImage,
    count: 2,
  },
  {
    slug: 'microondas',
    label: 'Microondas',
    description: 'Inverter, Grill e Compact',
    gradient: 'from-teal-500 to-green-400',
    bgGradient: 'from-teal-50 to-green-50',
    borderColor: 'border-teal-100',
    image: microondasImage,
    count: 3,
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function Categories() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2"
            >
              Explore
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-black text-gray-900"
            >
              Nossas Categorias
            </motion.h2>
          </div>
          <Link
            to="/produtos"
            className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
          >
            Ver todos
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.slug} variants={item} className="h-full">
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className={`group flex h-full flex-col bg-gradient-to-br ${cat.bgGradient} border ${cat.borderColor} rounded-3xl overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Image */}
                <div className="relative h-36 shrink-0 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className={`absolute top-3 right-3 w-7 h-7 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg`}>
                    <span className="text-white text-xs font-bold">{cat.count}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{cat.label}</h3>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{cat.description}</p>

                  <div className={`flex items-center gap-1 mt-auto pt-3 text-xs font-semibold bg-gradient-to-r ${cat.gradient} bg-clip-text text-transparent group-hover:gap-2 transition-all`}>
                    Ver produtos
                    <ArrowRight size={12} className={`bg-gradient-to-r ${cat.gradient} bg-clip-text`} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
