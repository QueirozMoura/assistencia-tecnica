import { useMemo, useState } from 'react'
import { adminGetAgendamentos, adminUpdateStatusAgendamento } from '../../../services/adminApi'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'

const STATUS_FILTERS = ['TODOS', 'PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']
const STATUS_OPTIONS = ['PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']

const statusStyles = {
  PENDENTE: 'bg-[#fff4cc] text-[#8a6d00]',
  CONFIRMADO: 'bg-[#d6ecff] text-[#004a99]',
  EM_ANDAMENTO: 'bg-[#e8ddff] text-[#5a2ca0]',
  CONCLUIDO: 'bg-[#d4f5e2] text-[#1a6b3c]',
  CANCELADO: 'bg-[#ffd9d9] text-[#8f1d1d]',
}

function formatDateBR(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [updatingId, setUpdatingId] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  async function fetchAgendamentos(filter = statusFilter) {
    try {
      setLoading(true)
      setError('')
      const response = await adminGetAgendamentos({
        page: 1,
        limit: 20,
        status: filter === 'TODOS' ? undefined : filter,
      })
      setAgendamentos(response?.data || [])
      setMeta(response?.meta || { page: 1, totalPages: 1, total: 0 })
      setHasLoaded(true)
    } catch (err) {
      setError(err?.message || 'Erro ao carregar agendamentos.')
      setAgendamentos([])
      setHasLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeStatus(id, status) {
    try {
      setUpdatingId(id)
      await adminUpdateStatusAgendamento(id, status)
      await fetchAgendamentos()
    } catch (err) {
      setError(err?.message || 'Erro ao atualizar status.')
    } finally {
      setUpdatingId(null)
    }
  }

  function handleFilterClick(status) {
    setStatusFilter(status)
    fetchAgendamentos(status)
  }

  const hasData = useMemo(() => agendamentos.length > 0, [agendamentos])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Agendamentos</h1>
          <p className="text-sm text-[#5b6472]">Gestão de agendamentos de assistência técnica.</p>
        </div>

        <button
          onClick={() => fetchAgendamentos()}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#0b66d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0857b1] disabled:opacity-60"
        >
          {loading ? 'Atualizando...' : hasLoaded ? 'Atualizar' : 'Carregar agendamentos'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => {
          const active = statusFilter === status
          return (
            <button
              key={status}
              onClick={() => handleFilterClick(status)}
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

      {error && <ErrorState title="Erro ao carregar agendamentos" message={error} onRetry={() => fetchAgendamentos()} />}

      <div className="overflow-hidden rounded-2xl border border-[#e5e8ee] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#f8fafc]">
              <tr className="text-left text-xs uppercase tracking-wide text-[#607089]">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Alterar status</th>
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
                agendamentos.map((ag) => (
                  <tr key={ag.id} className="text-sm text-[#1f2937]">
                    <td className="px-4 py-3 font-semibold">#{ag.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{ag?.nomeContato || '—'}</div>
                      <div className="text-xs text-[#667085]">{ag?.telefoneContato || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {ag?.equipamento || '—'}{ag?.marca ? ` • ${ag.marca}` : ''}{ag?.modelo ? ` • ${ag.modelo}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[ag.status] || 'bg-[#e5e8ee] text-[#43474f]'}`}>
                        {ag.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDateBR(ag?.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ag.status}
                        onChange={(e) => handleChangeStatus(ag.id, e.target.value)}
                        disabled={updatingId === ag.id}
                        className="rounded-lg border border-[#dbe1ea] px-2 py-1.5 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8" colSpan={6}>
                    <EmptyState
                      title="Nenhum agendamento encontrado"
                      message={hasLoaded ? 'Tente ajustar os filtros para visualizar resultados.' : 'Clique em "Carregar agendamentos" para buscar dados.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && meta.totalPages > 1 && (
        <div className="text-xs text-[#5b6472]">
          Total de registros: {meta.total}
        </div>
      )}
    </div>
  )
}
