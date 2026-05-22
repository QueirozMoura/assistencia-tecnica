import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Márcia Oliveira',
    location: 'São Paulo, SP',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MO&backgroundColor=3b82f6&textColor=ffffff',
    rating: 5,
    text: 'Comprei a geladeira Samsung French Door e fiquei impressionada com a qualidade. Entrega rápida, instalação profissional e o produto é ainda mais bonito pessoalmente. JFQ superou minhas expectativas!',
    product: 'Geladeira Samsung French Door 502L',
    date: 'Fevereiro 2024',
    verified: true,
  },
  {
    id: 2,
    name: 'Roberto Almeida',
    location: 'Rio de Janeiro, RJ',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RA&backgroundColor=7c3aed&textColor=ffffff',
    rating: 5,
    text: 'O LG WashTower mudou completamente minha lavanderia. A IA aprende meus hábitos de lavagem e o espaço economizado é enorme. Atendimento da JFQ foi impecável do início ao fim.',
    product: 'Lava e Seca LG WashTower 14kg',
    date: 'Janeiro 2024',
    verified: true,
  },
  {
    id: 3,
    name: 'Patricia Santos',
    location: 'Belo Horizonte, MG',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PS&backgroundColor=059669&textColor=ffffff',
    rating: 5,
    text: 'Melhor compra do ano! A máquina de lavar Samsung Eco Bubble é silenciosíssima e lava perfeitamente. O suporte pós-venda da JFQ é excepcional. Recomendo 100%!',
    product: 'Máquina de Lavar Samsung Eco Bubble 13kg',
    date: 'Dezembro 2023',
    verified: true,
  },
  {
    id: 4,
    name: 'Carlos Mendes',
    location: 'Curitiba, PR',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=CM&backgroundColor=dc2626&textColor=ffffff',
    rating: 5,
    text: 'Comprei o microondas Samsung Inverter Pro e a diferença é gritante. Os alimentos ficam muito mais saborosos e o aquecimento é uniforme. A JFQ tem o melhor custo-benefício do mercado.',
    product: 'Microondas Samsung Inverter Pro 32L',
    date: 'Março 2024',
    verified: true,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2"
          >
            Avaliações
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black text-gray-900"
          >
            O que nossos clientes dizem
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400" fill="#facc15" />
                  ))}
                </div>
                <Quote size={20} className="text-blue-100" fill="#dbeafe" />
              </div>

              {/* Text */}
              <p className="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-4">
                "{t.text}"
              </p>

              {/* Product */}
              <div className="text-xs text-blue-600 font-semibold bg-blue-50 rounded-xl px-3 py-1.5 mb-4 line-clamp-1">
                {t.product}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                    {t.name}
                    {t.verified && (
                      <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-white">
                          <path d="M10 3L5 8L2 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{t.location} • {t.date}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Overall rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 bg-white rounded-3xl px-8 py-5 shadow-card">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={24} className="text-yellow-400" fill="#facc15" />
              ))}
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-gray-900">4.9 / 5.0</div>
              <div className="text-sm text-gray-500">Baseado em +12.000 avaliações verificadas</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
