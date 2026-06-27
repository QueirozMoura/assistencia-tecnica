export default function ErrorState({ title = 'Não foi possível carregar os dados.', message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-base font-semibold text-red-700">{title}</p>
      {message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  )
}
