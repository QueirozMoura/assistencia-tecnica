import { Link } from 'react-router-dom'

export default function MeusPedidos() {
  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/minha-conta" className="p-2 rounded-xl hover:bg-[#e5e8ee] transition-colors text-[#43474f]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Meus Pedidos</h1>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-12 text-center">
          <div className="w-16 h-16 bg-[#cce0ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M3 3h3l3 12h12l3-9H9" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="22" r="2" fill="#003366"/>
              <circle cx="20" cy="22" r="2" fill="#003366"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#003366] mb-2">Nenhum pedido ainda</h2>
          <p className="text-sm text-[#737780] mb-6">Seus pedidos aparecerão aqui após a finalização da compra.</p>
          <Link to="/catalogo" className="inline-flex items-center gap-2 bg-[#0070ea] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#0059bb] transition-colors">
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  )
}
