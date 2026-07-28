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
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em]'
  const map = {
    PENDENTE: `${base} border-[#facc15] bg-[#fef9c3] text-[#854d0e]`,
    PAGO: `${base} border-[#22c55e] bg-[#dcfce7] text-[#166534]`,
    PREPARANDO: `${base} border-[#60a5fa] bg-[#dbeafe] text-[#1d4ed8]`,
    ENVIADO: `${base} border-[#a78bfa] bg-[#ede9fe] text-[#6d28d9]`,
    ENTREGUE: `${base} border-[#16a34a] bg-[#dcfce7] text-[#14532d]`,
    CANCELADO: `${base} border-[#ef4444] bg-[#fee2e2] text-[#991b1b]`,
  }
  return map[normalizeStatus(status)] || `${base} border-[#e2e8f0] bg-[#f8fafc] text-[#475569]`
}

function getPaymentStatusStyle(status) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em]'
  const map = {
    PAID: `${base} border-[#22c55e] bg-[#dcfce7] text-[#166534]`,
    PENDING: `${base} border-[#facc15] bg-[#fef9c3] text-[#854d0e]`,
    REJECTED: `${base} border-[#ef4444] bg-[#fee2e2] text-[#991b1b]`,
    REFUNDED: `${base} border-[#94a3b8] bg-[#f1f5f9] text-[#475569]`,
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

function getProdutoImage(item) {
  const direct = item?.imagem || item?.image || item?.foto || item?.thumbnail || item?.urlImagem || item?.imageUrl
  const nested = item?.produto?.imagem || item?.produto?.image || item?.produto?.foto || item?.produto?.thumbnail
  return direct || nested || ''
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
      imagem: getProdutoImage(item),
    }
  })
}

function DetailCard({ label, value, highlight = false, badge = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all ${
        highlight
          ? 'border-[#bfdbfe] bg-gradient-to-br from-[#f0f7ff] to-[#e0efff]'
          : 'border-[#e5e8ee] bg-white'
      }`}
    >
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] text-[#5b6472] mb-2">{label}</p>
      {badge ? (
        value
      ) : (
        <p
          className={`font-semibold break-words ${
            highlight ? 'text-2xl sm:text-[1.75rem] font-extrabold tracking-tight text-[#0070ea]' : 'text-base text-[#003366]'
          }`}
        >
          {value}
        </p>
      )}
    </div>
  )
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

  const statusPedido = normalizeStatus(pedido?.status)
  const statusPagamento = normalizeStatus(pedido?.paymentStatus)
  const formaPagamento = pedido?.paymentMethod || pedido?.formaPagamento || ''
  const clienteNome =
    pedido?.cliente?.nome ||
    pedido?.clienteNome ||
    pedido?.user?.name ||
    pedido?.usuario?.nome ||
    pedido?.nomeCliente ||
    'Não informado'

  const timeline = useMemo(() => getTimeline(pedido), [pedido])
  const itens = useMemo(() => normalizeItens(pedido), [pedido])

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#475569]">Carregando detalhes do pedido...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#b42318]">{error}</p>
            <div className="mt-4">
              <Link
                to="/meus-pedidos"
                className="inline-flex items-center justify-center rounded-xl border border-[#fca5a5] bg-white px-4 py-2 text-sm font-semibold text-[#b42318] hover:bg-[#fff5f5]"
              >
                Voltar para meus pedidos
              </Link>
            </div>
          </div>
        ) : !pedido ? (
          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#475569]">Pedido não encontrado.</p>
            <div className="mt-4">
              <Link
                to="/meus-pedidos"
                className="inline-flex items-center justify-center rounded-xl border border-[#dbe4f0] px-4 py-2 text-sm font-semibold text-[#003366] hover:bg-[#f8fafc]"
              >
                Voltar para meus pedidos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#dbe4f0] bg-gradient-to-r from-white via-[#f8fbff] to-[#eef6ff] p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5b6472]">Área do cliente</p>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#003366]">Detalhes do pedido</h1>
                  <p className="mt-2 text-sm sm:text-base text-[#334155]">
                    Acompanhe o status e os itens da sua compra em tempo real.
                  </p>
                  <div className="mt-4 inline-flex items-center rounded-xl border border-[#bfdbfe] bg-white px-3 py-2 text-sm font-semibold text-[#1d4ed8] shadow-sm">
                    Pedido #{pedido.id}
                  </div>
                </div>

                <div className="md:self-start">
                  <Link
                    to="/meus-pedidos"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#c7d9ee] bg-white px-4 py-2 text-sm font-semibold text-[#003366] shadow-sm transition-colors hover:bg-[#f5f9ff]"
                  >
                    Voltar
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e8ee] bg-white p-5 sm:p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <DetailCard label="Número do pedido" value={`#${pedido.id}`} />
                <DetailCard label="Data da compra" value={formatDate(pedido.createdAt)} />
                <DetailCard label="Nome do cliente" value={clienteNome} />
                <DetailCard label="Valor total" value={formatMoney(pedido.valorTotal)} highlight />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                <DetailCard label="Status do pedido" value={<span className={getPedidoStatusStyle(statusPedido)}>{statusPedido}</span>} badge />
                <DetailCard
                  label="Status do pagamento"
                  value={<span className={getPaymentStatusStyle(statusPagamento)}>{getPaymentStatusLabel(statusPagamento)}</span>}
                  badge
                />
                <DetailCard label="Forma de pagamento" value={getPaymentMethodLabel(formaPagamento)} />
              </div>
            </section>

            <section className="rounded-2xl border border-[#e5e8ee] bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#003366] mb-5">Acompanhamento</h2>

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
                      <li key={etapa} className="relative flex gap-4 rounded-xl border border-[#eef2f7] bg-[#fbfdff] px-3 py-3 sm:px-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={`z-10 h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                              isConcluded
                                ? 'border-[#16a34a] bg-[#dcfce7] text-[#166534]'
                                : isCurrent
                                  ? 'border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8] shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
                                  : 'border-[#cbd5e1] bg-white text-[#64748b]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          {index < timeline.etapas.length - 1 && (
                            <span className={`mt-1 h-10 w-[3px] rounded-full ${index < timeline.concluidoAte ? 'bg-[#22c55e]' : 'bg-[#dbe4f0]'}`} />
                          )}
                        </div>

                        <div className="pt-0.5">
                          <p className={`text-sm sm:text-base font-semibold ${isCurrent ? 'text-[#1d4ed8]' : 'text-[#0f172a]'}`}>{etapa}</p>
                          <p className="mt-1 text-xs text-[#64748b]">
                            {isCurrent ? 'Etapa atual do seu pedido' : isConcluded ? 'Etapa concluída' : 'Aguardando avanço'}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>

            <section className="rounded-2xl border border-[#e5e8ee] bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#003366] mb-4">Produtos do pedido</h2>

              {itens.length === 0 ? (
                <p className="text-sm text-[#737780]">Nenhum item encontrado para este pedido.</p>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-[#e8edf4]">
                    <table className="w-full min-w-[620px] border-collapse bg-white">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#5b6472] border-b border-[#e5e8ee] bg-[#f8fbff]">
                          <th className="py-3 px-4">Produto</th>
                          <th className="py-3 px-4">Quantidade</th>
                          <th className="py-3 px-4">Valor unitário</th>
                          <th className="py-3 px-4">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((item) => (
                          <tr key={item.id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f9fbff] transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                                  {item.imagem ? (
                                    <img src={item.imagem} alt={item.nome} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[10px] font-semibold uppercase text-[#94a3b8]">Sem imagem</div>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-[#0f172a]">{item.nome}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#334155]">{item.quantidade}</td>
                            <td className="py-3 px-4 text-sm text-[#334155]">{formatMoney(item.valorUnitario)}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-[#003366]">{formatMoney(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {itens.map((item) => (
                      <article key={item.id} className="rounded-xl border border-[#e8edf4] bg-[#fbfdff] p-4 shadow-sm">
                        <div className="flex gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
                            {item.imagem ? (
                              <img src={item.imagem} alt={item.nome} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] font-semibold uppercase text-[#94a3b8]">Sem imagem</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#0f172a] break-words">{item.nome}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-white border border-[#e2e8f0] p-2">
                                <p className="text-[#64748b]">Quantidade</p>
                                <p className="font-semibold text-[#0f172a]">{item.quantidade}</p>
                              </div>
                              <div className="rounded-lg bg-white border border-[#e2e8f0] p-2">
                                <p className="text-[#64748b]">Valor unitário</p>
                                <p className="font-semibold text-[#0f172a]">{formatMoney(item.valorUnitario)}</p>
                              </div>
                              <div className="col-span-2 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] p-2">
                                <p className="text-[#475569]">Subtotal</p>
                                <p className="font-bold text-[#1d4ed8]">{formatMoney(item.subtotal)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
