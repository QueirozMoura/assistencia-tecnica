import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, Truck, Zap, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import heroImage from '../../assets/images/WhatsApp Image 2026-05-22 at 22.24.02.jpeg';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const stats = [
  { value: '15+', label: 'Anos de experiência' },
  { value: '50k+', label: 'Clientes satisfeitos' },
  { value: '4.9', label: 'Avaliação média' },
  { value: '24h', label: 'Suporte disponível' },
];

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-800/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjMzNDQiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0tNCA0aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnptLTQgNGgtMnYtMmgydjJ6bTAtNGgtMnYtMmgydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8"
            >
              <Zap size={14} className="text-blue-400" fill="currentColor" />
              <span className="text-blue-300 text-sm font-semibold">
                Eletrodomésticos Premium com Assistência Especializada
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6"
            >
              Tecnologia que{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                transforma
              </span>{' '}
              seu lar
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="text-lg text-gray-300 leading-relaxed mb-10 max-w-xl"
            >
              Descubra nossa seleção exclusiva de eletrodomésticos das melhores marcas do mundo.
              Qualidade premium, garantia estendida e assistência técnica especializada em cada produto.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link to="/produtos">
                <Button size="xl" icon={<ArrowRight size={20} />} iconPosition="right">
                  Explorar Produtos
                </Button>
              </Link>
              <Link to="/produtos?categoria=geladeira">
                <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                  Ver Destaques
                </Button>
              </Link>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-black text-white">{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right content - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main image card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={heroImage}
                  alt="Geladeira Premium"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Product info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-xs font-medium">Samsung French Door</p>
                        <p className="text-white font-bold text-lg leading-tight">Premium 502L</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={12} className="text-yellow-400" fill="#facc15" />
                          ))}
                          <span className="text-white/70 text-xs ml-1">(634)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-xs line-through">R$ 10.999</p>
                        <p className="text-white font-black text-2xl">R$ 8.999</p>
                        <p className="text-blue-300 text-xs">12x R$ 749,99</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 glass rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Shield size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Garantia</p>
                    <p className="text-green-400 text-xs font-bold">+3 meses JFQ</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Truck size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Frete Grátis</p>
                    <p className="text-blue-400 text-xs">Todo o Brasil</p>
                  </div>
                </div>
              </motion.div>

              {/* Discount badge */}
              <div className="absolute top-4 left-4 bg-red-500 text-white font-black text-sm rounded-2xl px-3 py-1.5 shadow-lg">
                18% OFF
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={20} className="text-white/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
