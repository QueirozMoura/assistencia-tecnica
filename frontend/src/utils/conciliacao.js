// Presentation rules for the manual reconciliation queue. No refund is ever automatic.
export const FINAL_STATUSES = ['REEMBOLSADO_MANUALMENTE', 'RESOLVIDO_SEM_REEMBOLSO', 'FALSO_POSITIVO']

export const STATUS_LABELS = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  REEMBOLSADO_MANUALMENTE: 'Reembolsado manualmente',
  RESOLVIDO_SEM_REEMBOLSO: 'Resolvido sem reembolso',
  FALSO_POSITIVO: 'Falso positivo',
}

export const TIPO_LABELS = {
  PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO: 'Pagamento confirmado após cancelamento',
  DIVERGENCIA_VALOR: 'Divergência de valor',
  DIVERGENCIA_PREFERENCIA: 'Divergência de preferência',
  PEDIDO_NAO_ENCONTRADO: 'Pedido não encontrado',
  REFERENCIA_NAO_MAPEAVEL: 'Referência não mapeável',
  ESTORNO_OU_CHARGEBACK: 'Estorno ou chargeback informado',
  VENDEDOR_OU_AMBIENTE_DIVERGENTE: 'Vendedor ou ambiente divergente',
}

export const VERIFICACAO_LABELS = {
  CONFIRMADO_PELO_PROVEDOR: 'Confirmado pelo Mercado Pago',
  NAO_VERIFICADO: 'Não verificado',
  SUSPEITO: 'Suspeito',
}

export const ACAO_LABELS = {
  REGISTRADA: 'Registrada',
  REOCORRENCIA: 'Nova notificação do mesmo pagamento',
  STATUS_ALTERADO: 'Status alterado',
}

export const label = (table, key) => table[key] || key || '—'

export function nextStatuses(status) {
  if (status === 'PENDENTE') return ['EM_ANALISE', ...FINAL_STATUSES]
  if (status === 'EM_ANALISE') return [...FINAL_STATUSES]
  return []
}

export const requiresNote = (status) => FINAL_STATUSES.includes(status)

// Only a provider-confirmed approved payment is displayed as money received.
// Divergent or suspicious events must never be presented as received funds.
export function isMoneyConfirmed(item) {
  return item?.verificacao === 'CONFIRMADO_PELO_PROVEDOR' && String(item?.statusProvedor).toLowerCase() === 'approved'
}

export function verificationTone(verificacao) {
  if (verificacao === 'CONFIRMADO_PELO_PROVEDOR') return 'confirmed'
  if (verificacao === 'SUSPEITO') return 'danger'
  return 'warning'
}

// Sidebar indicator: open items; urgent when the provider itself confirmed money for any of them.
// Internal indicator only: nothing is sent outside the panel.
export function pendingIndicator(resumo) {
  const count = Number(resumo?.abertas)
  if (!Number.isFinite(count) || count <= 0) return null
  const confirmed = Number(resumo?.abertasConfirmadasPeloProvedor) || 0
  return { count, text: count > 99 ? '99+' : String(count), urgent: confirmed > 0,
    title: `${count} pendência(s) de conciliação aberta(s)${confirmed > 0 ? `, ${confirmed} com pagamento confirmado pelo Mercado Pago` : ''}` }
}
