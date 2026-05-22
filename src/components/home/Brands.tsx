import React from 'react';
import { motion } from 'framer-motion';

const brands = [
  { name: 'Samsung', bg: 'from-blue-600 to-blue-800' },
  { name: 'LG', bg: 'from-red-600 to-red-800' },
  { name: 'Electrolux', bg: 'from-teal-600 to-teal-800' },
  { name: 'Brastemp', bg: 'from-blue-700 to-indigo-900' },
  { name: 'Whirlpool', bg: 'from-indigo-600 to-indigo-800' },
  { name: 'Consul', bg: 'from-slate-600 to-slate-800' },
];

export function Brands() {
  return (
    <section className="py-10 md:py-14 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest mb-8"
        >
          Marcas que atendemos
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {brands.map(({ name, bg }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`bg-gradient-to-br ${bg} text-white font-black text-sm md:text-base px-6 py-3 rounded-2xl shadow-md opacity-60 hover:opacity-90 transition-all duration-300 cursor-default tracking-wider`}
            >
              {name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
