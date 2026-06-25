import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#f7f9ff] py-20">
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-[#cce0ff] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search size={36} className="text-[#003366]" />
        </div>
        <h1 className="text-6xl font-bold text-[#003366] mb-3">404</h1>
        <h2 className="text-xl font-semibold text-[#181c20] mb-3">Página não encontrada</h2>
        <p className="text-[#43474f] mb-8 max-w-sm mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#0070ea] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0059bb] transition-all"
          >
            <Home size={16} />
            Ir para o Início
          </Link>
          <Link
            to="/catalogo"
            className="flex items-center gap-2 border border-[#c3c6d1] text-[#43474f] px-6 py-3 rounded-xl font-medium hover:bg-white transition-all"
          >
            <ArrowLeft size={16} />
            Ver Produtos
          </Link>
        </div>
      </div>
    </div>
  )
}
