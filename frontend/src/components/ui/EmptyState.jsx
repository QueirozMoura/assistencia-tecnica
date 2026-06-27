export default function EmptyState({ title = 'Nenhum dado encontrado.', message, action }) {
  return (
    <div className="rounded-2xl border border-[#e5e8ee] bg-white p-8 text-center">
      <p className="text-base font-semibold text-[#181c20]">{title}</p>
      {message ? <p className="mt-1 text-sm text-[#737780]">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
