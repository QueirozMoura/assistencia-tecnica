import { useMemo, useState } from 'react'
import {
  adminGetAgendamentoById,
  adminGetAgendamentos,
  adminUpdateStatusAgendamento,
} from '../../../services/adminApi'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'

const STATUS_FILTERS = ['TODOS', 'PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']
const STATUS_OPTIONS = ['PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']

const STATUS_ACTIONS = [
  { label: 'Confirmar agendamento', value: 'CONFIRMADO' },
  { label: 'Colocar em andamento', value: 'EM_ANDAMENTO' },
  { label: 'Finalizar atendimento', value: 'CONCLUIDO' },
  { label: 'Cancelar agendamento', value: 'CANCELADO' },
]

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

function renderField(value) {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [updatingId, setUpdatingId] = useState(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState(null)
  const [agendamentoDetalhes, setAgendamentoDetalhes] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsUpdating, setDetailsUpdating] = useState(false)

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
      setError('')
      await adminUpdateStatusAgendamento(id, status)
      await fetchAgendamentos()

      if (selectedAgendamentoId === id && agendamentoDetalhes) {
        setAgendamentoDetalhes((prev) => (prev ? { ...prev, status } : prev))
      }
    } catch (err) {
      setError(err?.message || 'Erro ao atualizar status.')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleOpenDetails(id) {
    try {
      setSelectedAgendamentoId(id)
      setDetailsLoading(true)
      setDetailsError('')
      setAgendamentoDetalhes(null)

      const response = await adminGetAgendamentoById(id)
      setAgendamentoDetalhes(response?.data || null)
    } catch (err) {
      setDetailsError(err?.message || 'Erro ao carregar detalhes do agendamento.')
    } finally {
      setDetailsLoading(false)
    }
  }

  function handleCloseDetails() {
    if (detailsUpdating) return
    setSelectedAgendamentoId(null)
    setAgendamentoDetalhes(null)
    setDetailsError('')
    setDetailsLoading(false)
  }

  async function handleDetailsStatusAction(status) {
    if (!selectedAgendamentoId) return

    try {
      setDetailsUpdating(true)
      setDetailsError('')
      await adminUpdateStatusAgendamento(selectedAgendamentoId, status)

      setAgendamentoDetalhes((prev) => (prev ? { ...prev, status } : prev))
      setAgendamentos((prev) =>
        prev.map((item) => (item.id === selectedAgendamentoId ? { ...item, status } : item))
      )
    } catch (err) {
      setDetailsError(err?.message || 'Erro ao atualizar status do agendamento.')
    } finally {
      setDetailsUpdating(false)
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
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Equipamento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Ações</th>
                <th className="px-4 py-3">Alterar status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf1f7]">
              {loading ? (
                <tr>
                  <td className="px-4 py-5" colSpan={7}>
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
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(ag.id)}
                        className="rounded-lg border border-[#dbe1ea] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2937] transition hover:bg-[#f8fafc]"
                      >
                        Detalhes
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ag.status}
                        onChange={(e) => handleChangeStatus(ag.id, e.target.value)}
                        disabled={updatingId === ag.id}
                        className="rounded-lg border border-[#dbe1ea] px-2 py-1.5 text-xs disabled:opacity-60"
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
                  <td className="px-4 py-8" colSpan={7}>
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

      {selectedAgendamentoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#e5e8ee] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#0f172a]">Detalhes do agendamento</h2>
                  <p className="text-xs text-[#667085]">Visualize informações completas e execute ações administrativas.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetails}
                  disabled={detailsUpdating}
                  className="rounded-lg border border-[#dbe1ea] px-3 py-1.5 text-xs font-semibold text-[#445066] transition hover:bg-[#f8fafc] disabled:opacity-60"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              {detailsLoading ? (
                <SkeletonLoader lines={10} />
              ) : detailsError ? (
                <ErrorState
                  title="Erro ao carregar detalhes"
                  message={detailsError}
                  onRetry={() => handleOpenDetails(selectedAgendamentoId)}
                />
              ) : agendamentoDetalhes ? (
                <>
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div><span className="font-semibold text-[#334155]">ID:</span> #{renderField(agendamentoDetalhes.id)}</div>
                    <div>
                      <span className="font-semibold text-[#334155]">Status atual:</span>{' '}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[agendamentoDetalhes.status] || 'bg-[#e5e8ee] text-[#43474f]'}`}>
                        {renderField(agendamentoDetalhes.status)}
                      </span>
                    </div>
                    <div><span className="font-semibold text-[#334155]">Nome do cliente:</span> {renderField(agendamentoDetalhes.nomeContato)}</div>
                    <div><span className="font-semibold text-[#334155]">Telefone:</span> {renderField(agendamentoDetalhes.telefoneContato)}</div>
                    <div><span className="font-semibold text-[#334155]">Email:</span> {renderField(agendamentoDetalhes.email)}</div>
                    <div><span className="font-semibold text-[#334155]">Data de criação:</span> {formatDateBR(agendamentoDetalhes.createdAt)}</div>
                    <div><span className="font-semibold text-[#334155]">Equipamento:</span> {renderField(agendamentoDetalhes.equipamento)}</div>
                    <div><span className="font-semibold text-[#334155]">Marca:</span> {renderField(agendamentoDetalhes.marca)}</div>
                    <div><span className="font-semibold text-[#334155]">Modelo:</span> {renderField(agendamentoDetalhes.modelo)}</div>
                    <div><span className="font-semibold text-[#334155]">Observações:</span> {renderField(agendamentoDetalhes.observacoes)}</div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-[#334155]">Problema relatado:</span>{' '}
                      {renderField(agendamentoDetalhes.problema)}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e5e8ee] bg-[#f8fafc] p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#607089]">Ações administrativas</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_ACTIONS.map((action) => (
                        <button
                          key={action.value}
                          type="button"
                          onClick={() => handleDetailsStatusAction(action.value)}
                          disabled={detailsUpdating || agendamentoDetalhes.status === action.value}
                          className="rounded-lg border border-[#dbe1ea] bg-white px-3 py-1.5 text-xs font-semibold text-[#1f2937] transition hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {detailsUpdating ? 'Atualizando...' : action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
