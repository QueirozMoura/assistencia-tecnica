import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import { adminGetConciliacao, adminUpdateStatusConciliacao } from '../../../services/adminApi'
import { formatPrice } from '../../../utils/formatPrice'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { CONCILIACAO_CHANGED_EVENT } from '../../../hooks/useConciliacaoPendentes'
import { ACAO_LABELS, STATUS_LABELS, TIPO_LABELS, label, nextStatuses, requiresNote } from '../../../utils/conciliacao'
import { VerificacaoBadge } from './ConciliacaoBadges'

const formatDateTime = (date) => (date ? new Date(date).toLocaleString('pt-BR') : '—')
const text = (value) => (value === null || value === undefined || value === '' ? '—' : String(value))

function Field({ name, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[#607089]">{name}</div>
      <div className="break-all text-sm font-medium text-[#1f2937]">{value}</div>
    </div>
  )
}

export default function ConciliacaoDetail() {
  const { id } = useParams()
  const load = useCallback(async () => (await adminGetConciliacao(id))?.data || null, [id])
  const { data: item, loading, error, reload } = useAsyncData(load, null)
  const [status, setStatus] = useState('')
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setFormError('')
    if (requiresNote(status) && observacao.trim().length < 3) {
      setFormError('Informe a justificativa da resolução (mínimo 3 caracteres).')
      return
    }
    setSaving(true)
    try {
      await adminUpdateStatusConciliacao(id, { status, observacao: observacao.trim() || undefined })
      setStatus('')
      setObservacao('')
      window.dispatchEvent(new Event(CONCILIACAO_CHANGED_EVENT))
      reload()
    } catch (err) {
      setFormError(err?.message || 'Não foi possível atualizar a pendência.')
      reload()
    } finally {
      setSaving(false)
    }
  }

  const options = item ? nextStatuses(item.status) : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Pendência #{id}</h1>
          <p className="text-sm text-[#5b6472]">
            Nenhum reembolso é automático. Reembolse manualmente no painel do Mercado Pago e registre aqui a resolução.
          </p>
        </div>
        <Link to="/admin/conciliacoes" className="text-sm font-semibold text-[#0b66d0] hover:underline">Voltar</Link>
      </div>

      {error && <ErrorState title="Erro ao carregar a pendência" message={error} onRetry={reload} />}
      {loading && !item && <SkeletonLoader lines={8} />}

      {item && (
        <>
          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-[#0f172a]">{label(TIPO_LABELS, item.tipo)}</div>
                <div className="text-sm text-[#5b6472]">Status: {label(STATUS_LABELS, item.status)}</div>
              </div>
              <VerificacaoBadge item={item} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field name="Pedido" value={item.pedidoId ? <Link className="text-[#0b66d0] hover:underline" to={`/admin/pedidos/${item.pedidoId}`}>#{item.pedidoId}</Link> : '—'} />
              <Field name="Status do pedido no evento" value={text(item.statusPedido)} />
              <Field name="Status no Mercado Pago" value={text(item.statusProvedor)} />
              <Field name="Valor no Mercado Pago" value={item.valorProvedor == null ? '—' : formatPrice(item.valorProvedor)} />
              <Field name="Valor do pedido" value={item.valorPedido == null ? '—' : formatPrice(item.valorPedido)} />
              <Field name="ID do pagamento (confirmado)" value={text(item.paymentId)} />
              <Field name="ID informado na notificação" value={text(item.paymentIdInformado)} />
              <Field name="Preferência (Mercado Pago)" value={text(item.preferenciaProvedor)} />
              <Field name="Preferência (pedido)" value={text(item.preferenciaPedido)} />
              <Field name="Referência externa" value={text(item.referenciaExterna)} />
              <Field name="Notificações recebidas" value={item.ocorrencias} />
              <Field name="Primeira / última vez" value={`${formatDateTime(item.primeiraVezEm)} / ${formatDateTime(item.ultimaVezEm)}`} />
              <Field name="Resolvido por" value={item.resolvidoPor ? `${item.resolvidoPor.nome} em ${formatDateTime(item.resolvidoEm)}` : '—'} />
              <Field name="Observação" value={text(item.observacao)} />
            </div>
          </div>

          {options.length > 0 ? (
            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#e5e8ee] bg-white p-5">
              <div className="text-sm font-semibold text-[#0f172a]">Atualizar status</div>
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Novo status" required
                className="w-full rounded-lg border border-[#dbe1ea] bg-white px-3 py-2 text-sm">
                <option value="">Selecione…</option>
                {options.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
              </select>
              <textarea value={observacao} onChange={(event) => setObservacao(event.target.value)} maxLength={1000} rows={3}
                aria-label="Justificativa" placeholder={requiresNote(status) ? 'Justificativa obrigatória (ex.: referência do reembolso manual). Não cole dados de cartão.' : 'Observação (opcional). Não cole dados de cartão.'}
                className="w-full rounded-lg border border-[#dbe1ea] px-3 py-2 text-sm" />
              {formError && <div className="text-sm text-[#b42318]" role="alert">{formError}</div>}
              <button type="submit" disabled={!status || saving}
                className="rounded-xl bg-[#0b66d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0857b1] disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <p className="text-xs text-[#667085]">Resoluções são definitivas e ficam registradas com responsável e data.</p>
            </form>
          ) : (
            <div className="rounded-2xl border border-[#e5e8ee] bg-[#f8fafc] p-4 text-sm text-[#445066]">Esta pendência está resolvida; o histórico é definitivo.</div>
          )}

          <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-[#0f172a]">Histórico auditável</div>
            <ol className="space-y-3">
              {(item.historico || []).map((entry) => (
                <li key={entry.id} className="border-l-2 border-[#dbe1ea] pl-3 text-sm">
                  <div className="font-medium text-[#1f2937]">
                    {label(ACAO_LABELS, entry.acao)}
                    {entry.statusAnterior || entry.statusNovo ? ` — ${entry.statusAnterior ? `${label(STATUS_LABELS, entry.statusAnterior)} → ` : ''}${label(STATUS_LABELS, entry.statusNovo)}` : ''}
                  </div>
                  <div className="text-xs text-[#667085]">{formatDateTime(entry.createdAt)}{entry.usuario ? ` · ${entry.usuario.nome}` : ''}</div>
                  {entry.observacao && <div className="mt-1 text-[#445066]">{entry.observacao}</div>}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
