import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import OrderStatusBadge from '../../../components/admin/OrderStatusBadge'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'
import { getPedidos } from '../../../services/adminApi'
import { formatPrice } from '../../../utils/formatPrice'

const STATUS_FILTERS = ['TODOS', 'PENDENTE', 'PAGO', 'ENVIADO', 'CANCELADO']

function formatDateBR(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Pedidos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pedidos, setPedidos] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentStatus = (searchParams.get('status') || 'TODOS').toUpperCase()
  const currentPage = Number(searchParams.get('page') || 1)

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getPedidos({
        status: currentStatus === 'TODOS' ? undefined : currentStatus,
        page: currentPage,
        limit: 10,
      })
      setPedidos(response?.data || [])
      setMeta(response?.meta || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      setError(err?.message || 'Erro ao carregar pedidos.')
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentStatus])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  function handleStatusChange(status) {
    const params = new URLSearchParams(searchParams)
    params.set('status', status)
    params.set('page', '1')
    setSearchParams(params)
  }

  function handlePageChange(page) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
  }

  const hasData = useMemo(() => pedidos.length > 0, [pedidos])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Pedidos</h1>
          <p className="text-sm text-[#5b6472]">Gestão de pedidos com experiência SaaS.</p>
        </div>

        <button
          onClick={fetchPedidos}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#0b66d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0857b1] disabled:opacity-60"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => {
          const active = currentStatus === status
          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-[#0b66d0] bg-[#eaf3ff] text-[#0b66d0]'
                  : 'border-[#dbe1ea] bg-white text-[#445066] hover:bg-[#f8fafc]'
              }`}
            >
              {status}
            </button>
          )
        })}
      </div>

      {error && <ErrorState title="Erro ao carregar pedidos" message={error} onRetry={fetchPedidos} />}

      <div className="overflow-hidden rounded-2xl border border-[#e5e8ee] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#f8fafc]">
              <tr className="text-left text-xs uppercase tracking-wide text-[#607089]">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor total</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf1f7]">
              {loading ? (
                <tr>
                  <td className="px-4 py-5" colSpan={6}>
                    <SkeletonLoader lines={6} />
                  </td>
                </tr>
              ) : hasData ? (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="text-sm text-[#1f2937]">
                    <td className="px-4 py-3 font-semibold">#{pedido.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{pedido?.cliente?.nome || 'Cliente não informado'}</div>
                      <div className="text-xs text-[#667085]">{pedido?.cliente?.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={pedido.status} />
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(Number(pedido?.valorTotal || 0))}</td>
                    <td className="px-4 py-3">{formatDateBR(pedido.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/pedidos/${pedido.id}`}
                        className="text-xs font-semibold text-[#0b66d0] hover:underline"
                      >
                        Ver detalhe
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8" colSpan={6}>
                    <EmptyState
                      title="Nenhum pedido encontrado"
                      message="Tente ajustar os filtros para visualizar resultados."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
            disabled={meta.page <= 1}
            className="rounded-lg border border-[#dbe1ea] px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs font-medium text-[#5b6472]">
            Página {meta.page} de {meta.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(Math.min(meta.totalPages, meta.page + 1))}
            disabled={meta.page >= meta.totalPages}
            className="rounded-lg border border-[#dbe1ea] px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
