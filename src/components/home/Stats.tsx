import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
  color: string;
}

const stats: StatItem[] = [
  {
    value: 15,
    suffix: '+',
    label: 'Anos no Mercado',
    description: 'Construindo confiança e excelência',
    color: 'text-blue-600',
  },
  {
    value: 50000,
    suffix: '+',
    label: 'Clientes Atendidos',
    description: 'Satisfeitos com nossos serviços',
    color: 'text-indigo-600',
  },
  {
    value: 98,
    suffix: '%',
    label: 'Satisfação',
    description: 'Índice de aprovação dos clientes',
    color: 'text-emerald-600',
  },
  {
    value: 24,
    suffix: 'h',
    label: 'Suporte',
    description: 'Atendimento rápido sempre disponível',
    color: 'text-purple-600',
  },
];

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const startVal = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease out
      setCount(Math.floor(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration, start]);

  return count;
}

function StatCounter({ stat }: { stat: StatItem }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const count = useCountUp(stat.value, 2000, isInView);

  const display = stat.value >= 1000
    ? `${(count / 1000).toFixed(count >= 1000 ? 0 : 1)}k`
    : count.toString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      <div className={`text-4xl md:text-5xl font-black ${stat.color} mb-2`}>
        {display}{stat.suffix}
      </div>
      <div className="font-bold text-gray-900 text-lg">{stat.label}</div>
      <div className="text-gray-500 text-sm mt-1">{stat.description}</div>
    </motion.div>
  );
}

export function Stats() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-blue-400 font-semibold text-sm uppercase tracking-widest mb-3"
          >
            Números que falam por si
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black text-white"
          >
            A escolha de quem entende
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
