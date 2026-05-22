import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Truck, CreditCard, Headphones, RefreshCw, Award, Zap, Users } from 'lucide-react';

const benefits = [
  {
    icon: Truck,
    title: 'Frete Grátis',
    description: 'Entrega gratuita em compras acima de R$ 2.000 para todo o Brasil.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Shield,
    title: 'Compra 100% Segura',
    description: 'Criptografia SSL de ponta a ponta em todas as transações.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: CreditCard,
    title: '12x Sem Juros',
    description: 'Parcelamento em até 12x sem juros em todos os cartões.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    icon: Headphones,
    title: 'Suporte Especializado',
    description: 'Equipe técnica disponível 7 dias por semana para te ajudar.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    icon: RefreshCw,
    title: '30 Dias para Troca',
    description: 'Troca ou devolução garantida em até 30 dias sem complicação.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    icon: Award,
    title: 'Garantia Estendida',
    description: 'Além da garantia de fábrica, oferecemos +3 meses JFQ.',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-100',
  },
  {
    icon: Zap,
    title: 'Entrega Rápida',
    description: 'Produtos disponíveis para entrega expressa em capitais.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
  },
  {
    icon: Users,
    title: 'Instalação Inclusa',
    description: 'Serviço de instalação profissional disponível na sua cidade.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function Benefits() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-2"
          >
            Por que escolher a JFQ?
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black text-gray-900 mb-4"
          >
            Sua satisfação é nossa prioridade
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto"
          >
            Oferecemos muito mais do que produtos. Entregamos uma experiência completa
            de compra com segurança, qualidade e cuidado em cada detalhe.
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {benefits.map(({ icon: Icon, title, description, color, bg, border }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`p-6 rounded-3xl border ${border} ${bg} group cursor-default`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
