import { useState, useEffect } from 'react'

/**
 * Barra de busca com debounce.
 * Props: value, onChange, placeholder, debounce (ms, default 400)
 */
export default function AdminSearchBar({
  value: externalValue = '',
  onChange,
  placeholder = 'Buscar...',
  debounce = 400,
}) {
  const [local, setLocal] = useState(externalValue)

  // Sincroniza se o valor externo mudar (ex: limpar filtros)
  useEffect(() => { setLocal(externalValue) }, [externalValue])

  // Debounce: só chama onChange após parar de digitar
  useEffect(() => {
    const t = setTimeout(() => { onChange?.(local) }, debounce)
    return () => clearTimeout(t)
  }, [local, debounce, onChange])

  return (
    <div className="relative">
      <svg
        width="16" height="16" viewBox="0 0 16 16" fill="none"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c3c6d1] pointer-events-none"
      >
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 border border-[#e5e8ee] rounded-xl text-sm text-[#181c20] placeholder-[#c3c6d1] outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all bg-white"
      />
      {local && (
        <button
          onClick={() => setLocal('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c3c6d1] hover:text-[#43474f] transition-colors"
          aria-label="Limpar busca"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
