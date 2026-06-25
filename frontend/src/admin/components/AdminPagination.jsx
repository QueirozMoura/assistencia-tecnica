/**
 * Paginação reutilizável para listagens do admin.
 * Props: page, totalPages, onPageChange
 */
export default function AdminPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  // Gera array de páginas com reticências
  function getPages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (page >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-2 rounded-xl border border-[#e5e8ee] text-sm font-medium text-[#43474f] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Anterior
      </button>

      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-[#c3c6d1] text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
              p === page
                ? 'bg-[#0070ea] text-white shadow-sm'
                : 'border border-[#e5e8ee] text-[#43474f] hover:bg-white'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-xl border border-[#e5e8ee] text-sm font-medium text-[#43474f] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Próxima →
      </button>
    </div>
  )
}
