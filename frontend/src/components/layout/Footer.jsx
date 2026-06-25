import { Link } from 'react-router-dom'
import {
  Phone, Mail, MapPin, Clock,
  Wrench, Shield, Star, Zap, Share2, Rss, Video,
} from 'lucide-react'

const footerLinks = {
  produtos: [
    { label: 'Máquinas de Lavar', to: '/catalogo?categoria=maquina-de-lavar' },
    { label: 'Lava e Seca', to: '/catalogo?categoria=lava-e-seca' },
    { label: 'Micro-ondas', to: '/catalogo?categoria=microondas' },
    { label: 'Centrífugas', to: '/catalogo?categoria=centrifuga' },
    { label: 'Peças e Acessórios', to: '/catalogo?categoria=pecas' },
  ],
  servicos: [
    { label: 'Conserto de Máquina', to: '/assistencia' },
    { label: 'Manutenção Preventiva', to: '/assistencia' },
    { label: 'Instalação', to: '/assistencia' },
    { label: 'Atendimento Emergencial', to: '/assistencia' },
    { label: 'Agendar Visita', to: '/agendamento' },
  ],
  empresa: [
    { label: 'Sobre Nós', to: '/sobre' },
    { label: 'Depoimentos', to: '/#depoimentos' },
    { label: 'Contato', to: '/contato' },
    { label: 'Política de Garantia', to: '/contato' },
    { label: 'Política de Privacidade', to: '/contato' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#001e40] text-white">
      {/* Main Footer */}
      <div className="container-max py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#0070ea] rounded-lg flex items-center justify-center">
                <Wrench size={18} className="text-white" />
              </div>
              <div className="leading-tight">
                <span className="block font-bold text-white text-lg leading-none">Eletro</span>
                <span className="block font-bold text-[#a7c8ff] text-lg leading-none">Center</span>
              </div>
            </Link>
            <p className="text-[#8fa8c8] text-sm leading-relaxed mb-6">
              Especialistas em assistência técnica e venda de máquinas de lavar. Mais de 10 anos cuidando dos seus eletrodomésticos.
            </p>

            {/* Diferenciais */}
            <div className="space-y-2">
              {[
                { icon: Shield, text: '90 dias de garantia' },
                { icon: Star, text: 'Técnicos certificados' },
                { icon: Zap, text: 'Atendimento em 24h' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-[#8fa8c8]">
                  <Icon size={14} className="text-[#0070ea]" />
                  {text}
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[
                { icon: Share2, href: '#', label: 'Instagram' },
                { icon: Rss, href: '#', label: 'Facebook' },
                { icon: Video, href: '#', label: 'YouTube' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#0070ea] transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Produtos */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Produtos</h3>
            <ul className="space-y-2.5">
              {footerLinks.produtos.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-[#8fa8c8] text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Serviços</h3>
            <ul className="space-y-2.5">
              {footerLinks.servicos.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[#8fa8c8] text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-[#0070ea] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">(11) 9999-9999</p>
                  <p className="text-[#8fa8c8] text-xs">WhatsApp disponível</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-[#0070ea] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm">contato@eletrocenter.com.br</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-[#0070ea] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm">São Paulo, SP</p>
                  <p className="text-[#8fa8c8] text-xs">Grande São Paulo e ABC</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={15} className="text-[#0070ea] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm">Seg–Sex: 8h às 18h</p>
                  <p className="text-[#8fa8c8] text-xs">Sáb: 8h às 14h</p>
                </div>
              </li>
            </ul>

            {/* Newsletter mini */}
            <div className="mt-6">
              <p className="text-[#8fa8c8] text-xs mb-2">Receba nossas ofertas:</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  aria-label="Seu e-mail para newsletter"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-[#8fa8c8] outline-none focus:border-[#0070ea] transition-colors"
                />
                <button
                  type="submit"
                  className="bg-[#0070ea] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#0059bb] transition-colors"
                >
                  OK
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-max py-4 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-[#8fa8c8]">
          <p>© {new Date().getFullYear()} EletroCenter. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/contato" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <span>|</span>
            <Link to="/contato" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
