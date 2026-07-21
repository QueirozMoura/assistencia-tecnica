import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, Mail, MapPin, Clock, MessageSquare, CheckCircle,
  ChevronRight, Send,
} from 'lucide-react'

const contactInfo = [
  {
    icon: Phone,
    title: 'Telefone',
    lines: ['(11) 96560-2135', '(11) 96560-2135'],
    color: 'bg-[#cce0ff]',
    iconColor: 'text-[#003366]',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    lines: ['(11) 96560-2135', 'Resposta rápida'],
    color: 'bg-[#d4f5e2]',
    iconColor: 'text-[#1a6b3c]',
    href: 'https://wa.me/5511965602135',
  },
  {
    icon: Mail,
    title: 'E-mail',
    lines: ['jqueiroz555@gmail.com', 'Respondemos em até 4h'],
    color: 'bg-[#cce0ff]',
    iconColor: 'text-[#003366]',
    href: 'mailto:jqueiroz555@gmail.com',
  },
  {
    icon: MapPin,
    title: 'Endereço',
    lines: ['Rua das Flores, 123', 'São Paulo, SP — 01234-567'],
    color: 'bg-[#ffecd1]',
    iconColor: 'text-[#7a4f00]',
  },
]

const hours = [
  { day: 'Segunda a Sexta', time: '8h às 18h' },
  { day: 'Sábado', time: '8h às 14h' },
  { day: 'Domingo e Feriados', time: 'Fechado' },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  const inputClass = 'w-full bg-white border border-[#c3c6d1] rounded-xl px-4 py-3 text-sm text-[#181c20] placeholder-[#737780] outline-none focus:border-[#0070ea] transition-colors'

  return (
    <div className="bg-[#f7f9ff] min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#001e40] to-[#003366] py-10 sm:py-12">
        <div className="container-max">
          <nav className="text-xs text-[#8fa8c8] mb-3 flex items-center gap-1">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <ChevronRight size={12} />
            <span className="text-white">Contato</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Entre em Contato</h1>
          <p className="text-[#8fa8c8]">Estamos prontos para atender você. Escolha o canal de sua preferência.</p>
        </div>
      </section>

      <div className="container-max py-6 sm:py-10">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sm:mb-10">
          {contactInfo.map((info) => {
            const Icon = info.icon
            const content = (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8ee] card-hover text-center h-full">
                <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <Icon size={20} className={info.iconColor} />
                </div>
                <h3 className="font-semibold text-[#003366] mb-2">{info.title}</h3>
                {info.lines.map((line, i) => (
                  <p key={i} className={`text-sm ${i === 0 ? 'text-[#181c20] font-medium' : 'text-[#737780]'}`}>{line}</p>
                ))}
              </div>
            )
            return info.href ? (
              <a key={info.title} href={info.href} target="_blank" rel="noopener noreferrer" className="block">
                {content}
              </a>
            ) : (
              <div key={info.title}>{content}</div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#e5e8ee]">
            <h2 className="font-bold text-[#003366] text-xl mb-6">Envie uma Mensagem</h2>

            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-[#d4f5e2] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-[#1a6b3c]" />
                </div>
                <h3 className="font-bold text-[#003366] mb-2">Mensagem enviada!</h3>
                <p className="text-sm text-[#43474f]">Responderemos em até 4 horas úteis.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                  className="mt-4 text-sm text-[#0070ea] hover:underline"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">Nome *</label>
                    <input required name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#43474f] mb-1.5">Telefone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 96560-2135" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#43474f] mb-1.5">E-mail *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#43474f] mb-1.5">Assunto</label>
                  <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
                    <option value="">Selecione o assunto...</option>
                    <option>Solicitar Orçamento</option>
                    <option>Dúvida sobre Produto</option>
                    <option>Acompanhar Pedido</option>
                    <option>Reclamação</option>
                    <option>Elogio</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#43474f] mb-1.5">Mensagem *</label>
                  <textarea
                    required
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Escreva sua mensagem..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#0070ea] text-white py-3.5 rounded-xl font-semibold hover:bg-[#0059bb] transition-all active:scale-95"
                >
                  <Send size={16} />
                  Enviar Mensagem
                </button>
              </form>
            )}
          </div>

          {/* Map + Hours */}
          <div className="space-y-5">
            {/* Map placeholder */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e5e8ee]">
              <div className="h-56 bg-gradient-to-br from-[#cce0ff] to-[#ebeef3] flex items-center justify-center relative">
                <div className="text-center">
                  <MapPin size={40} className="text-[#003366] mx-auto mb-2" />
                  <p className="font-semibold text-[#003366]">São Paulo, SP</p>
                  <p className="text-sm text-[#43474f]">Rua das Flores, 123</p>
                </div>
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(#003366 1px, transparent 1px), linear-gradient(90deg, #003366 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[#003366] mb-1">Nossa Localização</h3>
                <p className="text-sm text-[#43474f]">Rua das Flores, 123 — São Paulo, SP</p>
                <p className="text-xs text-[#737780] mt-1">CEP: 01234-567</p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#0070ea] font-medium mt-3 hover:underline"
                >
                  Ver no Google Maps <ChevronRight size={14} />
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e8ee]">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-[#0070ea]" />
                <h3 className="font-semibold text-[#003366]">Horário de Funcionamento</h3>
              </div>
              <div className="space-y-2.5">
                {hours.map((h) => (
                  <div key={h.day} className="flex justify-between items-center py-2 border-b border-[#f1f4f9] last:border-0">
                    <span className="text-sm text-[#43474f]">{h.day}</span>
                    <span className={`text-sm font-semibold ${h.time === 'Fechado' ? 'text-[#ba1a1a]' : 'text-[#003366]'}`}>
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/5511965602135"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-[#25D366] text-white p-5 rounded-2xl hover:bg-[#1ebe5d] transition-all group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare size={22} />
              </div>
              <div>
                <p className="font-bold">Falar no WhatsApp</p>
                <p className="text-sm text-green-100">Atendimento rápido e direto</p>
              </div>
              <ChevronRight size={20} className="ml-auto transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
