import { Link } from 'react-router-dom'
import {
  Wrench, Layers, RotateCcw, Zap, Shield, Clock,
  CheckCircle, ArrowRight, MessageSquare, Calendar, Search,
  Phone,
} from 'lucide-react'
import SectionHeader from '../components/ui/SectionHeader'
import { services, workflowSteps } from '../data/services'
import { faqs } from '../data/brands'

const iconMap = {
  WashingMachine: Wrench,
  Layers,
  RotateCcw,
  Wrench,
  Shield,
  Zap,
  MessageSquare,
  Calendar,
  Search,
  CheckCircle,
}

const workflowIcons = { MessageSquare, Calendar, Search, CheckCircle }

export default function Services() {
  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#001e40] to-[#003366] py-12 sm:py-16">
        <div className="container-max text-center">
          <span className="inline-block bg-white/20 text-[#a7c8ff] text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Assistência Técnica
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Serviços Especializados em Eletrodomésticos
          </h1>
          <p className="text-[#8fa8c8] text-lg max-w-2xl mx-auto mb-8">
            Técnicos certificados, peças originais e garantia em todos os serviços. Atendemos em toda a Grande São Paulo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/agendamento"
              className="flex items-center gap-2 bg-[#0070ea] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0059bb] transition-all"
            >
              <Calendar size={16} />
              Agendar Visita
            </Link>
            <a
              href="tel:+5511965602135"
              className="flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              <Phone size={16} />
              (11) 96560-2135
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 sm:py-16">
        <div className="container-max">
          <SectionHeader
            badge="Nossos Serviços"
            title="O que podemos fazer por você"
            subtitle="Oferecemos soluções completas para todos os tipos de equipamentos de lavanderia."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Wrench
              return (
                <div
                  key={service.id}
                  id={service.slug}
                  className="bg-white rounded-2xl p-6 premium-shadow border border-transparent hover:border-[#cce0ff] transition-all group"
                >
                  <div className="w-12 h-12 bg-[#cce0ff] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0070ea] transition-colors">
                    <Icon size={22} className="text-[#003366] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-[#003366] text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-[#43474f] leading-relaxed mb-4">{service.description}</p>

                  {/* Features */}
                  <div className="space-y-1.5 mb-5">
                    {service.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-[#43474f]">
                        <CheckCircle size={13} className="text-[#0070ea] flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex gap-4 mb-5 pt-4 border-t border-[#e5e8ee]">
                    <div className="flex items-center gap-1.5 text-xs text-[#737780]">
                      <Clock size={13} className="text-[#0070ea]" />
                      {service.avgTime}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#737780]">
                      <Shield size={13} className="text-[#0070ea]" />
                      {service.warranty}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0070ea]">{service.price}</span>
                    <Link
                      to="/agendamento"
                      className="flex items-center gap-1.5 text-sm font-semibold text-[#003366] hover:text-[#0070ea] transition-colors"
                    >
                      Solicitar <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Como Funciona"
            title="Processo Simples e Transparente"
            subtitle="Do agendamento ao reparo, acompanhe cada etapa do atendimento."
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-[#e5e8ee] z-0" />

            {workflowSteps.map((step) => {
              const Icon = workflowIcons[step.icon] || CheckCircle
              return (
                <div key={step.step} className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-[#003366] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="w-6 h-6 bg-[#0070ea] rounded-full flex items-center justify-center mx-auto mb-3 text-white text-xs font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-[#003366] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#43474f] leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-12 sm:py-14 bg-[#f7f9ff]">
        <div className="container-max">
          <SectionHeader
            badge="Marcas"
            title="Atendemos Todas as Marcas"
            subtitle="Nossos técnicos são treinados para atender os equipamentos das principais marcas do mercado."
          />
          <div className="flex flex-wrap justify-center gap-3">
            {['Brastemp', 'Consul', 'Electrolux', 'LG', 'Samsung', 'Panasonic', 'Midea', 'Philco', 'Whirlpool'].map((brand) => (
              <span
                key={brand}
                className="bg-white border border-[#e5e8ee] text-[#43474f] text-sm font-medium px-5 py-2.5 rounded-full card-hover"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Dúvidas"
            title="Perguntas Frequentes"
            subtitle="Tire suas dúvidas sobre nossos serviços de assistência técnica."
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="group border border-[#e5e8ee] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#f7f9ff] transition-colors list-none">
                  <span className="font-medium text-[#181c20] text-sm pr-4">{faq.question}</span>
                  <ArrowRight size={16} className="text-[#737780] flex-shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-4 text-sm text-[#43474f] leading-relaxed border-t border-[#e5e8ee] pt-3">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-14 bg-gradient-to-r from-[#003366] to-[#0070ea]">
        <div className="container-max text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Pronto para resolver o problema do seu equipamento?</h2>
          <p className="text-[#a7c8ff] mb-8">Diagnóstico gratuito. Técnico na sua casa em até 24 horas.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/agendamento"
              className="flex items-center gap-2 bg-white text-[#003366] px-8 py-3.5 rounded-xl font-bold hover:bg-[#f1f4f9] transition-all"
            >
              <Calendar size={18} />
              Agendar Agora
            </Link>
            <a
              href="https://wa.me/5511965602135"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              <MessageSquare size={18} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
