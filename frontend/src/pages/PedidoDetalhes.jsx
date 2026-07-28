import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { clientListMeusPedidos } from '../services/clientApi'

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase()
}

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

function getPaymentMethodLabel(value) {
  const method = String(value || '').trim().toLowerCase()
  const map = {
    pix: 'Pix',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito',
    boleto: 'Boleto',
    account_money: 'Saldo em conta',
    mercado_pago: 'Mercado Pago',
  }
  return map[method] || (value ? String(value) : 'Não informada')
}

function getTimeline(pedido) {
  const etapas = [
    'Pedido recebido',
    'Pagamento aprovado',
    'Preparando pedido',
    'Enviado',
    'Entregue',
  ]

  const statusPedido = normalizeStatus(pedido?.status)
  const statusPagamento = normalizeStatus(pedido?.paymentStatus)

  if (statusPedido === 'CANCELADO') {
    return { etapas, etapaAtual: 0, cancelado: true, concluidoAte: -1 }
  }

  const mapaStatus = {
    PENDENTE: 1,
    PAGO: 2,
    PREPARANDO: 3,
    ENVIADO: 4,
    ENTREGUE: 5,
  }

  let etapaAtual = mapaStatus[statusPedido] ?? 1

  if (statusPedido === 'PENDENTE' && statusPagamento === 'PAID') {
    etapaAtual = 2
  }

  return {
    etapas,
    etapaAtual,
    cancelado: false,
    concluidoAte: etapaAtual === 5 ? etapas.length - 1 : etapaAtual - 1,
  }
}

function normalizeItens(pedido) {
  const itens = pedido?.itens || pedido?.items || []
  if (!Array.isArray(itens)) return []

  return itens.map((item, index) => {
    const quantidade = Number(item.quantidade ?? item.quantity ?? 0)
    const valorUnitario = Number(item.valorUnitario ?? item.precoUnitario ?? item.price ?? 0)
    const subtotalCalculado = quantidade * valorUnitario
    const subtotal = Number(item.subtotal ?? item.total ?? subtotalCalculado)

    return {
      id: item.id ?? item.produtoId ?? `item-${index}`,
      nome: item.nomeProduto ?? item.nome ?? item.produto?.nome ?? 'Produto',
      quantidade,
      valorUnitario,
      subtotal,
    }
  })
}

export default function PedidoDetalhes() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPedido() {
      if (!id) {
        if (!active) return
        setError('Pedido não informado.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const response = await clientListMeusPedidos()
        const pedidos = Array.isArray(response?.data) ? response.data : []
        const selected = pedidos.find((item) => String(item.id) === String(id))

        if (!active) return

        if (!selected) {
          setError('Pedido não encontrado.')
          setPedido(null)
          return
        }

        setPedido(selected)
      } catch {
        if (!active) return
        setError('Não foi possível carregar os detalhes do pedido.')
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    void loadPedido()

    return () => {
      active = false
    }
  }, [id])

  const timeline = useMemo(() => getTimeline(pedido), [pedido])
  const itens = useMemo(() => normalizeItens(pedido), [pedido])

  const clienteNome =
    pedido?.cliente?.nome ||
    pedido?.nomeCliente ||
    pedido?.cliente ||
    '—'

  const statusPedido = normalizeStatus(pedido?.status) || '—'
  const statusPagamento = normalizeStatus(pedido?.paymentStatus) || 'UNKNOWN'
  const formaPagamento =
    pedido?.formaPagamento || pedido?.paymentMethod || pedido?.metodoPagamento

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-8 sm:py-10">
      <div className="container-max max-w-5xl mx-auto px-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#003366]">Detalhes do pedido</h1>
          <Link
            to="/meus-pedidos"
            className="inline-flex items-center justify-center rounded-xl border border-[#c3c6d1] px-4 h-10 text-sm font-semibold text-[#43474f] hover:bg-gray-50 transition-colors"
          >
            Voltar
          </Link>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-[#0070ea] border-t-transparent animate-spin" />
            <p className="text-sm text-[#737780] mt-3">Carregando pedido...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 text-center">
            <h2 className="text-lg font-bold text-[#003366] mb-2">Não foi possível carregar o pedido</h2>
            <p className="text-sm text-[#737780]">{error}</p>
          </div>
        )}

        {!loading && !error && pedido && (
          <div className="space-y-5">
            <section className="bg-white rounded-2xl border border-[#e5e8ee] p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-1">Número do pedido</p>
                  <p className="text-lg font-bold text-[#003366]">#{pedido.id}</p>
                </div>

                <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-1">Data da compra</p>
                  <p className="text-base font-semibold text-[#003366]">{formatDate(pedido.createdAt)}</p>
                </div>

                <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-1">Nome do cliente</p>
                  <p className="text-base font-semibold text-[#003366] break-words">{clienteNome}</p>
                </div>

                <div className="rounded-xl border border-[#d6e7ff] bg-[#f2f8ff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-1">Valor total</p>
                  <p className="text-2xl font-extrabold tracking-tight text-[#0070ea]">{formatMoney(pedido.valorTotal)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-2">Status do pedido</p>
                  <span className={getPedidoStatusStyle(statusPedido)}>{statusPedido}</span>
                </div>

                <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-2">Status do pagamento</p>
                  <span className={getPaymentStatusStyle(statusPagamento)}>{getPaymentStatusLabel(statusPagamento)}</span>
                </div>

                <div className="rounded-xl border border-[#e5e8ee] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6472] mb-1">Forma de pagamento</p>
                  <p className="text-base font-semibold text-[#003366]">{getPaymentMethodLabel(formaPagamento)}</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-[#e5e8ee] p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[#003366] mb-4">Acompanhamento</h2>

              {timeline.cancelado ? (
                <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4">
                  <p className="text-sm font-semibold text-[#b42318]">Pedido cancelado</p>
                  <p className="text-sm text-[#7f1d1d] mt-1">Este pedido foi cancelado.</p>
                </div>
              ) : (
                <ol className="space-y-4">
                  {timeline.etapas.map((etapa, index) => {
                    const isConcluded = index <= timeline.concluidoAte
                    const isCurrent = index === timeline.etapaAtual - 1

                    return (
                      <li key={etapa} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                              isConcluded
                                ? 'border-[#16a34a] bg-[#dcfce7] text-[#166534]'
                                : isCurrent
                                  ? 'border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]'
                                  : 'border-[#cbd5e1] bg-white text-[#64748b]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          {index < timeline.etapas.length - 1 && (
                            <span
                              className={`w-[2px] h-7 mt-1 ${
                                index < timeline.concluidoAte ? 'bg-[#16a34a]' : 'bg-[#e2e8f0]'
                              }`}
                            />
                          )}
                        </div>

                        <div className="pt-0.5">
                          <p className={`text-sm font-semibold ${isCurrent ? 'text-[#1d4ed8]' : 'text-[#003366]'}`}>
                            {etapa}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-[#5b6472] mt-0.5">Etapa atual</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-[#e5e8ee] p-5 sm:p-6">
              <h2 className="text-lg font-bold text-[#003366] mb-4">Produtos do pedido</h2>

              {itens.length === 0 ? (
                <p className="text-sm text-[#737780]">Nenhum item encontrado para este pedido.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#5b6472] border-b border-[#e5e8ee]">
                        <th className="py-3 pr-3">Produto</th>
                        <th className="py-3 pr-3">Quantidade</th>
                        <th className="py-3 pr-3">Valor unitário</th>
                        <th className="py-3">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item) => (
                        <tr key={item.id} className="border-b border-[#f1f5f9] last:border-b-0">
                          <td className="py-3 pr-3 text-sm font-semibold text-[#0f172a]">{item.nome}</td>
                          <td className="py-3 pr-3 text-sm text-[#334155]">{item.quantidade}</td>
                          <td className="py-3 pr-3 text-sm text-[#334155]">{formatMoney(item.valorUnitario)}</td>
                          <td className="py-3 text-sm font-semibold text-[#003366]">{formatMoney(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
