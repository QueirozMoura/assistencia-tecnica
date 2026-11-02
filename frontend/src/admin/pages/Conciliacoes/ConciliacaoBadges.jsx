import { VERIFICACAO_LABELS, isMoneyConfirmed, label, verificationTone } from '../../../utils/conciliacao'

const TONES = {
  confirmed: 'bg-[#fef3f2] text-[#b42318] border-[#fecdca]',
  warning: 'bg-[#fffaeb] text-[#b54708] border-[#fedf89]',
  danger: 'bg-[#fef3f2] text-[#912018] border-[#fda29b]',
}

// "Confirmed" means the provider confirmed an approved payment; divergent events are explicitly NOT presumed to be received money.
export function VerificacaoBadge({ item }) {
  const tone = verificationTone(item.verificacao)
  return (
    <div className="space-y-1">
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{label(VERIFICACAO_LABELS, item.verificacao)}</span>
      <div className="text-xs text-[#667085]">{isMoneyConfirmed(item) ? 'Dinheiro confirmado' : 'Não presuma recebimento'}</div>
    </div>
  )
}
