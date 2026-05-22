import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Home, ArrowRight, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';

const steps = [
  { icon: CheckCircle, label: 'Pedido confirmado', active: true },
  { icon: Package, label: 'Em preparação', active: false },
  { icon: Truck, label: 'Em transporte', active: false },
  { icon: Home, label: 'Entregue', active: false },
];

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('pedido') || 'PED-2024-000000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, delay: 0.3 }}
            >
              <CheckCircle size={52} className="text-emerald-500" fill="#d1fae5" />
            </motion.div>
          </div>
        </motion.div>

        {/* Content card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-premium p-8 text-center"
        >
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Pedido Confirmado!
          </h1>
          <p className="text-gray-500 mb-6">
            Obrigado pela sua compra. Você receberá um e-mail de confirmação em breve.
          </p>

          {/* Order number */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl px-8 py-5 mb-8 inline-block">
            <p className="text-sm text-gray-500 mb-1">Número do Pedido</p>
            <p className="text-2xl font-black text-blue-700 font-mono">{orderNumber}</p>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between mb-10 px-4">
            {steps.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.15 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      s.active
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <s.icon size={18} />
                  </motion.div>
                  <span className={`text-xs font-medium hidden sm:block ${s.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px flex-1 mx-2 ${i === 0 ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { emoji: '📦', title: 'Prazo de Entrega', value: '7-10 dias úteis' },
              { emoji: '📧', title: 'Confirmação', value: 'Enviada por e-mail' },
              { emoji: '📞', title: 'Suporte', value: '0800 JFQ HELP' },
            ].map(({ emoji, title, value }) => (
              <div key={title} className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">{emoji}</div>
                <p className="text-xs text-gray-500 font-medium">{title}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Rating prompt */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 mb-8 text-center">
            <p className="text-sm font-semibold text-yellow-800 mb-2">
              Sua opinião importa para nós!
            </p>
            <p className="text-xs text-yellow-600 mb-3">
              Após receber seu produto, não se esqueça de nos avaliar:
            </p>
            <div className="flex justify-center gap-1">
              {[1,2,3,4,5].map(i => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star size={24} className="text-yellow-300 hover:text-yellow-400 transition-colors" fill="#fde68a" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/conta/pedidos" className="flex-1">
              <Button variant="outline" fullWidth>
                Ver Meus Pedidos
              </Button>
            </Link>
            <Link to="/produtos" className="flex-1">
              <Button fullWidth icon={<ArrowRight size={18} />} iconPosition="right">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Confetti decoration */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: Math.random() * 360,
                opacity: 0,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3,
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'][Math.floor(Math.random() * 5)],
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
