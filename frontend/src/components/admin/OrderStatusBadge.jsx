const STATUS_STYLES = {
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  PAGO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ENVIADO: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
}

export default function OrderStatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase()
  const style = STATUS_STYLES[normalized] || 'bg-slate-100 text-slate-700 border-slate-200'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>
      {normalized || 'N/A'}
    </span>
  )
}
