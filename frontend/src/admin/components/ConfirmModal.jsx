import { useEffect } from 'react'

/**
 * Modal de confirmação reutilizável.
 * Props: open, title, message, confirmLabel, danger, onConfirm, onCancel, loading
 */
export default function ConfirmModal({
  open,
  title      = 'Confirmar ação',
  message    = 'Tem certeza que deseja continuar?',
  confirmLabel = 'Confirmar',
  danger     = false,
  onConfirm,
  onCancel,
  loading    = false,
}) {
  // Fechar com Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        {/* Ícone */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-[#ffdad6]' : 'bg-[#cce0ff]'}`}>
          {danger ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 8v4M11 16h.01" stroke="#ba1a1a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9.27 3.27a2 2 0 013.46 0l7.27 12.6A2 2 0 0118.27 19H3.73a2 2 0 01-1.73-3.13L9.27 3.27z" stroke="#ba1a1a" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="#003366" strokeWidth="1.5"/>
              <path d="M11 7v4M11 15h.01" stroke="#003366" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        <h3 className="text-base font-bold text-[#181c20] text-center mb-2">{title}</h3>
        <p className="text-sm text-[#737780] text-center mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-[#e5e8ee] text-sm font-semibold text-[#43474f] hover:bg-[#f7f9ff] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2
              ${danger ? 'bg-[#ba1a1a] hover:bg-[#93000a]' : 'bg-[#0070ea] hover:bg-[#0059bb]'}`}
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
