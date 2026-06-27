import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientListMeusPedidos } from '../services/clientApi'

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPedidos() {
      try {
        setLoading(true)
        setError('')
        const response = await clientListMeusPedidos()
        if (!active) return
        setPedidos(Array.isArray(response?.data) ? response.data : [])
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Não foi possível carregar seus pedidos.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPedidos()

    return () => {
      active = false
    }
  }, [])

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

        {loading && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-12 text-center">
            <p className="text-sm text-[#737780]">Carregando pedidos...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-12 text-center">
            <h2 className="text-lg font-bold text-[#003366] mb-2">Erro ao carregar pedidos</h2>
            <p className="text-sm text-[#737780]">{error}</p>
          </div>
        )}

        {!loading && !error && pedidos.length === 0 && (
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
        )}

        {!loading && !error && pedidos.length > 0 && (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-[#737780]">Pedido #{pedido.id}</p>
                    <p className="text-sm text-[#737780]">Data: {formatDate(pedido.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#003366]">Status: {pedido.status}</p>
                    <p className="text-sm text-[#737780]">Pagamento: {pedido.paymentStatus || '-'}</p>
                    <p className="text-base font-bold text-[#003366]">{formatMoney(pedido.valorTotal)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
