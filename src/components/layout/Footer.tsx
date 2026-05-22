import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Instagram, Facebook, Youtube, Twitter, MapPin, Phone, Mail, Shield, Truck, CreditCard, RefreshCw } from 'lucide-react';
import { categoryLabels } from '../../data/products';

const footerLinks = {
  produtos: Object.entries(categoryLabels).map(([slug, label]) => ({
    label,
    to: `/produtos?categoria=${slug}`,
  })),
  empresa: [
    { label: 'Sobre a JFQ', to: '/sobre' },
    { label: 'Assistência Técnica', to: '/assistencia' },
    { label: 'Blog', to: '/blog' },
    { label: 'Trabalhe Conosco', to: '/carreiras' },
    { label: 'Sustentabilidade', to: '/sustentabilidade' },
  ],
  suporte: [
    { label: 'Central de Ajuda', to: '/ajuda' },
    { label: 'Acompanhar Pedido', to: '/rastrear' },
    { label: 'Trocas e Devoluções', to: '/trocas' },
    { label: 'Garantia', to: '/garantia' },
    { label: 'Fale Conosco', to: '/contato' },
  ],
};

const benefits = [
  { icon: Truck, title: 'Frete Grátis', description: 'Acima de R$ 2.000' },
  { icon: Shield, title: 'Compra Segura', description: 'Criptografia SSL' },
  { icon: CreditCard, title: '12x Sem Juros', description: 'Em todos os cartões' },
  { icon: RefreshCw, title: '30 Dias', description: 'Para troca ou devolução' },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Benefits bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">{title}</p>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shadow-glow">
                <Zap size={24} className="text-white" fill="white" />
              </div>
              <div>
                <div className="font-black text-2xl text-white">JFQ</div>
                <div className="text-sm text-blue-400 font-semibold tracking-widest uppercase">Assistência</div>
              </div>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              Especialistas em eletrodomésticos premium com mais de 15 anos de experiência.
              Confiança, qualidade e excelência em cada atendimento.
            </p>

            <div className="space-y-2 mb-6">
              <a href="tel:08000000000" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Phone size={14} className="text-blue-400" />
                0800 JFQ HELP
              </a>
              <a href="mailto:contato@jfqassistencia.com.br" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail size={14} className="text-blue-400" />
                contato@jfqassistencia.com.br
              </a>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} className="text-blue-400" />
                Atendemos todo o Brasil
              </span>
            </div>

            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors group"
                >
                  <Icon size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">Produtos</h3>
            <ul className="space-y-2.5">
              {footerLinks.produtos.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">Empresa</h3>
            <ul className="space-y-2.5">
              {footerLinks.empresa.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">Suporte</h3>
            <ul className="space-y-2.5">
              {footerLinks.suporte.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2024 JFQ Assistência. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link to="/privacidade" className="hover:text-gray-300 transition-colors">Privacidade</Link>
            <span>•</span>
            <Link to="/termos" className="hover:text-gray-300 transition-colors">Termos</Link>
            <span>•</span>
            <Link to="/cookies" className="hover:text-gray-300 transition-colors">Cookies</Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Payment methods */}
            {['Visa', 'MC', 'Pix', 'Elo'].map((method) => (
              <div
                key={method}
                className="bg-gray-800 text-xs text-gray-400 px-2 py-1 rounded-lg font-semibold"
              >
                {method}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
