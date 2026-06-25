import { Link } from 'react-router-dom'
import { Clock, Shield, ArrowRight, Wrench, Layers, RotateCcw, Zap } from 'lucide-react'

const iconMap = {
  WashingMachine: Wrench,
  Layers,
  RotateCcw,
  Wrench,
  Shield,
  Zap,
}

export default function ServiceCard({ service }) {
  const Icon = iconMap[service.icon] || Wrench

  return (
    <div className="bg-white rounded-2xl p-6 premium-shadow flex flex-col border border-transparent hover:border-[#cce0ff] transition-all duration-300 group">
      {/* Icon */}
      <div className="w-12 h-12 bg-[#cce0ff] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0070ea] transition-colors">
        <Icon size={22} className="text-[#003366] group-hover:text-white transition-colors" />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-[#003366] text-base mb-2">{service.title}</h3>
      <p className="text-sm text-[#43474f] leading-relaxed mb-4 flex-1">{service.shortDescription}</p>

      {/* Meta */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#737780]">
          <Clock size={13} className="text-[#0070ea]" />
          <span>{service.avgTime}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#737780]">
          <Shield size={13} className="text-[#0070ea]" />
          <span>{service.warranty}</span>
        </div>
      </div>

      {/* Price */}
      <p className="text-sm font-semibold text-[#0070ea] mb-4">{service.price}</p>

      {/* CTA */}
      <Link
        to="/agendamento"
        className="flex items-center gap-2 text-sm font-semibold text-[#003366] hover:text-[#0070ea] transition-colors group/link"
      >
        Solicitar Serviço
        <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
      </Link>
    </div>
  )
}
