import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'
import { adminGetConciliacoes, adminGetConciliacoesResumo } from '../../../services/adminApi'
import { formatPrice } from '../../../utils/formatPrice'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { STATUS_LABELS, TIPO_LABELS, VERIFICACAO_LABELS, label } from '../../../utils/conciliacao'
import { VerificacaoBadge } from './ConciliacaoBadges'

const STATUS_FILTERS = ['ABERTAS', 'TODAS', 'PENDENTE', 'EM_ANALISE', 'REEMBOLSADO_MANUALMENTE', 'RESOLVIDO_SEM_REEMBOLSO', 'FALSO_POSITIVO']
const EMPTY = { itens: [], meta: { page: 1, totalPages: 1, total: 0 }, resumo: null }

const formatDateTime = (date) => (date ? new Date(date).toLocaleString('pt-BR') : '—')

export default function Conciliacoes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStatus = (searchParams.get('status') || 'ABERTAS').toUpperCase()
  const verificacao = searchParams.get('verificacao') || ''
  const currentPage = Number(searchParams.get('page') || 1)

  const load = useCallback(async () => {
    const statusParam = STATUS_LABELS[currentStatus] ? currentStatus : undefined
    const [lista, resumo] = await Promise.all([
      adminGetConciliacoes({ status: statusParam, verificacao: verificacao || undefined, page: currentPage, limit: 10 }),
      adminGetConciliacoesResumo(),
    ])
    // "Abertas" = Pendente + Em análise: the API filters one status at a time, so it is filtered client-side for that view.
    const itens = currentStatus === 'ABERTAS' ? (lista?.data || []).filter((i) => ['PENDENTE', 'EM_ANALISE'].includes(i.status)) : lista?.data || []
    return { itens, meta: lista?.meta || EMPTY.meta, resumo: resumo?.data || null }
  }, [currentPage, currentStatus, verificacao])
  const { data, loading, error, reload } = useAsyncData(load, EMPTY)

  function update(name, value) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(name, value); else params.delete(name)
    params.set('page', '1')
    setSearchParams(params)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Conciliação financeira</h1>
          <p className="text-sm text-[#5b6472]">
            Pendências de pagamento que exigem análise manual. Nenhum reembolso é feito automaticamente:
            reembolse no painel do Mercado Pago e registre a resolução aqui.
          </p>
        </div>
        <button onClick={reload} disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#0b66d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0857b1] disabled:opacity-60">
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {data.resumo && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-[#607089]">Pendências abertas</div>
            <div className="text-2xl font-bold text-[#0f172a]">{data.resumo.abertas}</div>
          </div>
          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-[#607089]">Abertas confirmadas pelo Mercado Pago</div>
            <div className="text-2xl font-bold text-[#b42318]">{data.resumo.abertasConfirmadasPeloProvedor}</div>
          </div>
          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-[#607089]">Resolvidas</div>
            <div className="text-2xl font-bold text-[#0f172a]">
              {data.resumo.porStatus.REEMBOLSADO_MANUALMENTE + data.resumo.porStatus.RESOLVIDO_SEM_REEMBOLSO + data.resumo.porStatus.FALSO_POSITIVO}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((status) => (
          <button key={status} onClick={() => update('status', status === 'ABERTAS' ? '' : status)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              currentStatus === status ? 'border-[#0b66d0] bg-[#eaf3ff] text-[#0b66d0]' : 'border-[#dbe1ea] bg-white text-[#445066] hover:bg-[#f8fafc]'}`}>
            {status === 'ABERTAS' ? 'Abertas' : status === 'TODAS' ? 'Todas' : STATUS_LABELS[status]}
          </button>
        ))}
        <select value={verificacao} onChange={(event) => update('verificacao', event.target.value)} aria-label="Filtrar por verificação"
          className="rounded-lg border border-[#dbe1ea] bg-white px-3 py-1.5 text-xs font-semibold text-[#334155]">
          <option value="">Toda verificação</option>
          {Object.entries(VERIFICACAO_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
        </select>
      </div>

      {error && <ErrorState title="Erro ao carregar conciliações" message={error} onRetry={reload} />}

      <div className="overflow-hidden rounded-2xl border border-[#e5e8ee] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#f8fafc]">
              <tr className="text-left text-xs uppercase tracking-wide text-[#607089]">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Verificação</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Valor (provedor)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Última notificação</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f7]">
              {loading ? (
                <tr><td className="px-4 py-5" colSpan={7}><SkeletonLoader lines={6} /></td></tr>
              ) : data.itens.length > 0 ? (
                data.itens.map((item) => (
                  <tr key={item.id} className="text-sm text-[#1f2937]">
                    <td className="px-4 py-3 font-medium">
                      {label(TIPO_LABELS, item.tipo)}
                      {item.ocorrencias > 1 && <div className="text-xs text-[#667085]">{item.ocorrencias} notificações</div>}
                    </td>
                    <td className="px-4 py-3"><VerificacaoBadge item={item} /></td>
                    <td className="px-4 py-3">{item.pedidoId ? <Link className="font-semibold text-[#0b66d0] hover:underline" to={`/admin/pedidos/${item.pedidoId}`}>#{item.pedidoId}</Link> : '—'}</td>
                    <td className="px-4 py-3">{item.valorProvedor == null ? '—' : formatPrice(item.valorProvedor)}</td>
                    <td className="px-4 py-3">{label(STATUS_LABELS, item.status)}</td>
                    <td className="px-4 py-3">{formatDateTime(item.ultimaVezEm)}</td>
                    <td className="px-4 py-3"><Link to={`/admin/conciliacoes/${item.id}`} className="text-xs font-semibold text-[#0b66d0] hover:underline">Analisar</Link></td>
                  </tr>
                ))
              ) : (
                <tr><td className="px-4 py-8" colSpan={7}><EmptyState title="Nenhuma pendência encontrada" message="Não há pendências para os filtros selecionados." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(Math.max(1, data.meta.page - 1))); setSearchParams(p) }}
            disabled={data.meta.page <= 1} className="rounded-lg border border-[#dbe1ea] px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:opacity-40">Anterior</button>
          <span className="text-xs font-medium text-[#5b6472]">Página {data.meta.page} de {data.meta.totalPages}</span>
          <button onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(Math.min(data.meta.totalPages, data.meta.page + 1))); setSearchParams(p) }}
            disabled={data.meta.page >= data.meta.totalPages} className="rounded-lg border border-[#dbe1ea] px-3 py-1.5 text-xs font-semibold text-[#334155] disabled:opacity-40">Próxima</button>
        </div>
      )}
    </div>
  )
}
