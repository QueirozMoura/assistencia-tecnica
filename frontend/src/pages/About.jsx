import { Link } from 'react-router-dom'
import {
  Shield, Award, Users, TrendingUp, Star, CheckCircle,
  Heart, Target, Zap, ArrowRight,
} from 'lucide-react'
import SectionHeader from '../components/ui/SectionHeader'
import { testimonials, stats } from '../data/testimonials'
import heroAbout from '../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47 (2).jpeg'

const values = [
  {
    icon: Shield,
    title: 'Confiança',
    desc: 'Construímos relacionamentos duradouros com nossos clientes baseados em transparência e honestidade.',
  },
  {
    icon: Award,
    title: 'Excelência',
    desc: 'Buscamos a perfeição em cada atendimento, utilizando as melhores técnicas e peças do mercado.',
  },
  {
    icon: Heart,
    title: 'Cuidado',
    desc: 'Tratamos cada equipamento como se fosse nosso, com atenção e dedicação em cada detalhe.',
  },
  {
    icon: Zap,
    title: 'Agilidade',
    desc: 'Valorizamos o seu tempo. Por isso, oferecemos atendimento rápido sem abrir mão da qualidade.',
  },
  {
    icon: Target,
    title: 'Comprometimento',
    desc: 'Assumimos a responsabilidade pelo resultado e garantimos a satisfação total do cliente.',
  },
  {
    icon: Users,
    title: 'Equipe',
    desc: 'Nossa equipe é formada por técnicos certificados e em constante atualização profissional.',
  },
]

const timeline = [
  { year: '2014', title: 'Fundação', desc: 'A EletroCenter foi fundada com o objetivo de oferecer assistência técnica de qualidade em São Paulo.' },
  { year: '2016', title: 'Expansão', desc: 'Expandimos nossa área de atendimento para toda a Grande São Paulo e ABC Paulista.' },
  { year: '2018', title: 'E-commerce', desc: 'Lançamos nossa loja online de eletrodomésticos, ampliando o acesso aos melhores produtos.' },
  { year: '2020', title: 'Certificações', desc: 'Obtivemos certificações das principais marcas: Samsung, LG, Electrolux e Brastemp.' },
  { year: '2022', title: '5.000 Clientes', desc: 'Atingimos a marca de 5.000 atendimentos realizados com 98% de satisfação.' },
  { year: '2024', title: 'Hoje', desc: 'Continuamos crescendo e inovando para oferecer o melhor serviço do mercado.' },
]

const statIcons = [Users, TrendingUp, Star, Award]

export default function About() {
  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#001e40] to-[#003366] py-16">
        <div className="container-max">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-white/20 text-[#a7c8ff] text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                Sobre Nós
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Mais de 10 anos cuidando dos seus eletrodomésticos
              </h1>
              <p className="text-[#8fa8c8] text-lg leading-relaxed mb-6">
                A EletroCenter nasceu da paixão por tecnologia e do compromisso com a qualidade. Somos especialistas em assistência técnica e venda de máquinas de lavar, lava e seca e centrífugas.
              </p>
              <Link
                to="/agendamento"
                className="inline-flex items-center gap-2 bg-[#0070ea] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0059bb] transition-all"
              >
                Agendar Atendimento <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative w-full h-80 rounded-2xl overflow-hidden">
                <img
                  src={heroAbout}
                  alt="Equipamentos EletroCenter"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001e40]/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-[#e5e8ee]">
        <div className="container-max py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = statIcons[i]
              return (
                <div key={stat.label} className="text-center">
                  <div className="w-10 h-10 bg-[#cce0ff] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon size={18} className="text-[#003366]" />
                  </div>
                  <p className="text-2xl font-bold text-[#003366]">{stat.value}{stat.suffix}</p>
                  <p className="text-sm text-[#737780] mt-1">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container-max">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e5e8ee]">
              <div className="w-12 h-12 bg-[#cce0ff] rounded-xl flex items-center justify-center mb-4">
                <Target size={22} className="text-[#003366]" />
              </div>
              <h2 className="text-xl font-bold text-[#003366] mb-3">Nossa Missão</h2>
              <p className="text-[#43474f] leading-relaxed">
                Oferecer serviços de assistência técnica e produtos de qualidade superior, garantindo a satisfação total dos nossos clientes através de atendimento ágil, transparente e com garantia real.
              </p>
            </div>
            <div className="bg-[#003366] rounded-2xl p-8 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Star size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-bold mb-3">Nossa Visão</h2>
              <p className="text-[#a7c8ff] leading-relaxed">
                Ser a empresa de referência em assistência técnica e venda de eletrodomésticos na Grande São Paulo, reconhecida pela excelência no atendimento e pela confiança dos nossos clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Nossos Valores"
            title="O que nos guia todos os dias"
            subtitle="Nossos valores são a base de cada atendimento e de cada decisão que tomamos."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#f7f9ff] rounded-2xl p-6 border border-[#e5e8ee] card-hover">
                <div className="w-11 h-11 bg-[#cce0ff] rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#003366]" />
                </div>
                <h3 className="font-semibold text-[#003366] mb-2">{title}</h3>
                <p className="text-sm text-[#43474f] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-[#f7f9ff]">
        <div className="container-max">
          <SectionHeader
            badge="Nossa História"
            title="Uma trajetória de crescimento"
            subtitle="Conheça os marcos mais importantes da nossa história."
          />
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#e5e8ee]" />
              <div className="space-y-6">
                {timeline.map((item, i) => (
                  <div key={item.year} className="flex gap-6 relative">
                    <div className="w-16 h-16 bg-[#003366] rounded-2xl flex items-center justify-center flex-shrink-0 z-10 shadow-md">
                      <span className="text-white text-xs font-bold">{item.year}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-5 flex-1 shadow-sm border border-[#e5e8ee] mt-2">
                      <h3 className="font-semibold text-[#003366] mb-1">{item.title}</h3>
                      <p className="text-sm text-[#43474f] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#001e40]">
        <div className="container-max">
          <SectionHeader
            badge="Depoimentos"
            title="O que nossos clientes dizem"
            light
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(3, 6).map((t) => (
              <div key={t.id} className="bg-white/10 rounded-2xl p-6 border border-white/10">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={14} className={s <= t.rating ? 'text-amber-400' : 'text-white/20'} fill={s <= t.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-[#a7c8ff] text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-[#0070ea]" />
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-[#8fa8c8]">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-14 bg-white">
        <div className="container-max">
          <SectionHeader
            badge="Diferenciais"
            title="Por que escolher a EletroCenter?"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              'Atendimento em até 24 horas',
              'Técnicos certificados pelas marcas',
              'Garantia de 90 dias em todos os serviços',
              'Peças 100% originais',
              'Diagnóstico gratuito sem compromisso',
              'Pagamento facilitado em até 12x',
              'Atendimento domiciliar',
              'Suporte pós-atendimento',
              'Equipe em constante treinamento',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 bg-[#f7f9ff] rounded-xl border border-[#e5e8ee]">
                <CheckCircle size={16} className="text-[#0070ea] flex-shrink-0" />
                <span className="text-sm text-[#43474f] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
