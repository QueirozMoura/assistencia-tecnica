import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import OrderStatusBadge from '../../../components/admin/OrderStatusBadge'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'
import { adminUpdateStatusPedido, getPedidoById } from '../../../services/adminApi'
import { formatPrice } from '../../../utils/formatPrice'

function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR')
}

function formatFallback(value) {
  if (value === null || value === undefined) return 'Não informado'
  const text = String(value).trim()
  return text ? text : 'Não informado'
}

export default function PedidoDetail() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        const response = await getPedidoById(id)
        if (!active) return
        setPedido(response?.data || null)
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Erro ao carregar detalhes do pedido.')
        setPedido(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Pedido #{id}</h1>
          <p className="text-sm text-[#5b6472]">Detalhes completos do pedido.</p>
        </div>
        <div className="flex items-center gap-2">
          {pedido && (
            <select
              value={pedido.status}
              disabled={updatingStatus}
              onChange={async (e) => {
                try {
                  setUpdatingStatus(true)
                  setError('')
                  const response = await adminUpdateStatusPedido(id, e.target.value)
                  setPedido(response?.data || pedido)
                } catch (err) {
                  setError(err?.message || 'Erro ao atualizar status do pedido.')
                } finally {
                  setUpdatingStatus(false)
                }
              }}
              className="rounded-xl border border-[#dbe1ea] bg-white px-3 py-2 text-sm font-medium text-[#334155]"
            >
              <option value="PENDENTE">PENDENTE</option>
              <option value="PAGO">PAGO</option>
              <option value="ENVIADO">ENVIADO</option>
              <option value="ENTREGUE">ENTREGUE</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          )}
          <Link to="/admin/pedidos" className="rounded-xl border border-[#dbe1ea] px-3 py-2 text-sm font-semibold text-[#334155]">
            Voltar
          </Link>
        </div>
      </div>

      {error && <ErrorState title="Erro ao carregar pedido" message={error} />}

      {loading ? (
        <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
          <SkeletonLoader lines={8} />
        </div>
      ) : !pedido ? (
        <EmptyState title="Pedido não encontrado" message="Não foi possível localizar os dados deste pedido." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-[#111827]">Informações gerais</h2>
              <div className="space-y-2 text-sm text-[#334155]">
                <p><span className="font-semibold">Cliente:</span> {pedido?.cliente?.nome || '—'}</p>
                <p><span className="font-semibold">Email:</span> {pedido?.cliente?.email || '—'}</p>
                <p><span className="font-semibold">Telefone:</span> {pedido?.cliente?.telefone || '—'}</p>
                <p><span className="font-semibold">Criado em:</span> {formatDateTime(pedido?.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-[#111827]">Resumo financeiro</h2>
              <div className="space-y-2 text-sm text-[#334155]">
                <p className="flex items-center justify-between">
                  <span>Status:</span>
                  <OrderStatusBadge status={pedido?.status} />
                </p>
                <p className="flex items-center justify-between">
                  <span>Valor total:</span>
                  <strong>{formatPrice(Number(pedido?.valorTotal || 0))}</strong>
                </p>
                <p className="flex items-center justify-between">
                  <span>Itens:</span>
                  <strong>{pedido?.itens?.length || 0}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#111827]">Dados da entrega</h2>
            <div className="grid grid-cols-1 gap-2 text-sm text-[#334155] md:grid-cols-2">
              <p><span className="font-semibold">Nome:</span> {formatFallback(pedido?.nomeDestinatario)}</p>
              <p><span className="font-semibold">Telefone:</span> {formatFallback(pedido?.telefoneEntrega)}</p>
              <p><span className="font-semibold">CEP:</span> {formatFallback(pedido?.cep)}</p>
              <p><span className="font-semibold">Rua:</span> {formatFallback(pedido?.rua)}</p>
              <p><span className="font-semibold">Número:</span> {formatFallback(pedido?.numero)}</p>
              <p><span className="font-semibold">Complemento:</span> {formatFallback(pedido?.complemento)}</p>
              <p><span className="font-semibold">Bairro:</span> {formatFallback(pedido?.bairro)}</p>
              <p><span className="font-semibold">Cidade:</span> {formatFallback(pedido?.cidade)}</p>
              <p><span className="font-semibold">Estado:</span> {formatFallback(pedido?.estado)}</p>
              <p className="md:col-span-2">
                <span className="font-semibold">Observações:</span> {formatFallback(pedido?.observacoes)}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e5e8ee] bg-white">
            <div className="border-b border-[#edf1f7] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#111827]">Itens do pedido</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#f8fafc]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[#607089]">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Qtd.</th>
                    <th className="px-4 py-3">Preço unitário</th>
                    <th className="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f7]">
                  {(pedido?.itens || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-medium text-[#1f2937]">{item?.produto?.nome || 'Produto removido'}</td>
                      <td className="px-4 py-3 text-sm text-[#334155]">{item.quantidade}</td>
                      <td className="px-4 py-3 text-sm text-[#334155]">{formatPrice(Number(item.precoUnitario || 0))}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#111827]">
                        {formatPrice(Number(item.precoUnitario || 0) * Number(item.quantidade || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
