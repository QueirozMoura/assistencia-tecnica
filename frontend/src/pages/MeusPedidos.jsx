import { useEffect, useMemo, useState } from 'react'
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

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase()
}

function getPedidoStatusStyle(status) {
  const base = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide'
  const map = {
    PENDENTE: `${base} border-[#fde68a] bg-[#fef9c3] text-[#854d0e]`,
    PAGO: `${base} border-[#bbf7d0] bg-[#dcfce7] text-[#166534]`,
    PREPARANDO: `${base} border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8]`,
    ENVIADO: `${base} border-[#ddd6fe] bg-[#ede9fe] text-[#6d28d9]`,
    ENTREGUE: `${base} border-[#86efac] bg-[#dcfce7] text-[#14532d]`,
    CANCELADO: `${base} border-[#fecaca] bg-[#fee2e2] text-[#991b1b]`,
  }
  return map[normalizeStatus(status)] || `${base} border-[#e2e8f0] bg-[#f8fafc] text-[#475569]`
}

function getPaymentStatusStyle(status) {
  const base = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide'
  const map = {
    PAID: `${base} border-[#bbf7d0] bg-[#dcfce7] text-[#166534]`,
    PENDING: `${base} border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]`,
    REJECTED: `${base} border-[#fecaca] bg-[#fee2e2] text-[#991b1b]`,
    REFUNDED: `${base} border-[#e5e7eb] bg-[#f3f4f6] text-[#4b5563]`,
  }
  return map[normalizeStatus(status)] || `${base} border-[#e2e8f0] bg-[#f8fafc] text-[#475569]`
}

function getPaymentStatusLabel(status) {
  const map = {
    PAID: 'Pago',
    PENDING: 'Aguardando pagamento',
    REJECTED: 'Pagamento recusado',
    REFUNDED: 'Reembolsado',
    UNKNOWN: 'Desconhecido',
  }
  return map[normalizeStatus(status)] || 'Desconhecido'
}

function StatCard({ title, value, tone = 'blue' }) {
  const toneMap = {
    blue: {
      iconBg: 'bg-[#dbeafe]',
      iconColor: 'text-[#1d4ed8]',
      valueColor: 'text-[#003366]',
    },
    sky: {
      iconBg: 'bg-[#e0f2fe]',
      iconColor: 'text-[#0369a1]',
      valueColor: 'text-[#0f172a]',
    },
    green: {
      iconBg: 'bg-[#dcfce7]',
      iconColor: 'text-[#166534]',
      valueColor: 'text-[#14532d]',
    },
  }

  const style = toneMap[tone] || toneMap.blue

  return (
    <div className="bg-white rounded-2xl border border-[#e5e8ee] p-4 sm:p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className={`w-10 h-10 rounded-xl ${style.iconBg} ${style.iconColor} flex items-center justify-center mb-3`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7h18M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${style.valueColor}`}>{value}</p>
      <p className="text-sm text-[#5b6472] mt-1">{title}</p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5 sm:p-6 animate-pulse">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="h-4 w-32 rounded bg-[#e5e7eb]" />
          <div className="h-4 w-40 rounded bg-[#eef2f7]" />
        </div>
        <div className="space-y-2 w-full sm:w-56">
          <div className="h-4 w-full rounded bg-[#e5e7eb]" />
          <div className="h-4 w-3/4 rounded bg-[#eef2f7]" />
          <div className="h-6 w-1/2 rounded bg-[#dbeafe]" />
        </div>
      </div>
      <div className="mt-5 h-10 w-32 rounded-xl bg-[#e5e7eb]" />
    </div>
  )
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

  const summary = useMemo(() => {
    const total = pedidos.length
    const entregues = pedidos.filter((pedido) => normalizeStatus(pedido.status) === 'ENTREGUE').length
    const emAndamento = pedidos.filter((pedido) => {
      const status = normalizeStatus(pedido.status)
      return !['ENTREGUE', 'CANCELADO'].includes(status)
    }).length

    return { total, emAndamento, entregues }
  }, [pedidos])

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10 sm:py-12">
      <div className="container-max max-w-6xl mx-auto px-4">
        <div className="flex items-start gap-3 sm:gap-4 mb-8 sm:mb-10">
          <Link to="/minha-conta" className="mt-1 p-2 rounded-xl hover:bg-[#e5e8ee] transition-colors text-[#43474f]" aria-label="Voltar para minha conta">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#dbeafe] text-[#1d4ed8] inline-flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 4h2l2.3 10.3A2 2 0 0 0 9.25 16h7.9a2 2 0 0 0 1.95-1.56L21 7H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="18" cy="20" r="1.5" fill="currentColor" />
                </svg>
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#003366]">Meus Pedidos</h1>
            </div>
            <p className="text-sm sm:text-base text-[#5b6472] mt-2">Acompanhe o histórico e o andamento das suas compras.</p>
          </div>
        </div>

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 sm:mb-10">
            <StatCard title="Total de pedidos" value={summary.total} tone="blue" />
            <StatCard title="Em andamento" value={summary.emAndamento} tone="sky" />
            <StatCard title="Entregues" value={summary.entregues} tone="green" />
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 sm:p-12 text-center">
            <h2 className="text-lg font-bold text-[#003366] mb-2">Erro ao carregar pedidos</h2>
            <p className="text-sm text-[#737780]">{error}</p>
          </div>
        )}

        {!loading && !error && pedidos.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 sm:p-12 text-center shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
            <div className="w-24 h-24 mx-auto mb-5 rounded-2xl bg-[#edf4ff] flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                <rect x="8" y="12" width="40" height="30" rx="6" stroke="#003366" strokeWidth="2.2" fill="#ffffff" />
                <path d="M18 24h20M18 30h14" stroke="#7aa7db" strokeWidth="2" strokeLinecap="round" />
                <circle cx="39" cy="39" r="7" fill="#dbeafe" />
                <path d="M42.5 42.5 46 46" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#003366] mb-2">Nenhum pedido encontrado</h2>
            <p className="text-sm sm:text-base text-[#737780] mb-6">Quando você realizar uma compra ela aparecerá aqui.</p>
            <Link to="/catalogo" className="inline-flex items-center justify-center gap-2 bg-[#0070ea] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#0059bb] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,89,187,0.25)] active:scale-[0.98] transition-all duration-300">
              Ir para catálogo
            </Link>
          </div>
        )}

        {!loading && !error && pedidos.length > 0 && (
          <div className="space-y-4 sm:space-y-5">
            {pedidos.map((pedido) => {
              const pedidoStatus = normalizeStatus(pedido.status) || '-'
              const paymentStatus = normalizeStatus(pedido.paymentStatus) || '-'

              return (
                <article
                  key={pedido.id}
                  className="bg-white rounded-2xl border border-[#e5e8ee] p-5 sm:p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)] transition-all duration-300"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-8">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#003366]">Pedido #{pedido.id}</h3>
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-[#5b6472]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M8 2v3M16 2v3M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{formatDate(pedido.createdAt)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-2">Status do pedido</p>
                          <span className={getPedidoStatusStyle(pedidoStatus)}>{pedidoStatus}</span>
                        </div>

                        <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-2">Status do pagamento</p>
                          <span className={getPaymentStatusStyle(paymentStatus)}>{paymentStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between">
                      <div className="rounded-xl border border-[#d6e7ff] bg-[#f2f8ff] p-4 mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-1">Valor total</p>
                        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0070ea]">{formatMoney(pedido.valorTotal)}</p>
                      </div>

                      <button
                        type="button"
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#0070ea] text-white px-5 h-11 text-sm font-semibold hover:bg-[#0059bb] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,89,187,0.25)] active:scale-[0.98] transition-all duration-300"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
