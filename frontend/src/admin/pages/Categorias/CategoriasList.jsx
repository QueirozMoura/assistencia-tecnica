import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  adminGetCategorias,
  adminDeleteCategoria,
  adminUpdateCategoria,
} from '../../../services/adminApi'
import ConfirmModal    from '../../components/ConfirmModal'
import AdminPagination from '../../components/AdminPagination'
import AdminSearchBar  from '../../components/AdminSearchBar'

const LIMIT = 10

export default function CategoriasList() {
  const navigate = useNavigate()

  const [categorias, setCategorias] = useState([])
  const [meta,       setMeta]       = useState({ total: 0, totalPages: 1 })
  const [page,       setPage]       = useState(1)
  const [busca,      setBusca]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  // Modal de exclusão
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, nome }
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState(null)

  // Toast de sucesso
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Buscar categorias ──────────────────────────────────────────
  const fetchCategorias = useCallback(() => {
    setLoading(true)
    setError(null)
    adminGetCategorias()
      .then((res) => {
        // Filtragem e paginação client-side (API não tem busca em categorias)
        const all = res.data ?? []
        const filtered = busca
          ? all.filter((c) =>
              c.nome.toLowerCase().includes(busca.toLowerCase()) ||
              c.slug.toLowerCase().includes(busca.toLowerCase())
            )
          : all
        const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT))
        const safePage   = Math.min(page, totalPages)
        const paginated  = filtered.slice((safePage - 1) * LIMIT, safePage * LIMIT)
        setCategorias(paginated)
        setMeta({ total: filtered.length, totalPages })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [busca, page])

  useEffect(() => { fetchCategorias() }, [fetchCategorias])

  // Reset página ao buscar
  useEffect(() => { setPage(1) }, [busca])

  // ── Toggle ativo ───────────────────────────────────────────────
  async function handleToggleAtivo(cat) {
    try {
      await adminUpdateCategoria(cat.id, { ativo: !cat.ativo })
      showToast(`Categoria ${!cat.ativo ? 'ativada' : 'desativada'} com sucesso.`)
      fetchCategorias()
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Excluir ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await adminDeleteCategoria(deleteTarget.id)
      setDeleteTarget(null)
      showToast('Categoria excluída com sucesso.')
      fetchCategorias()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-[#1a6b3c] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[#181c20]">Categorias</h2>
          <p className="text-sm text-[#737780]">{meta.total} categoria{meta.total !== 1 ? 's' : ''} encontrada{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/admin/categorias/nova"
          className="flex items-center gap-2 bg-[#0070ea] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0059bb] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nova Categoria
        </Link>
      </div>

      {/* Busca */}
      <div className="max-w-sm">
        <AdminSearchBar
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por nome ou slug..."
        />
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
          <button onClick={fetchCategorias} className="ml-auto underline font-medium">Tentar novamente</button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#e5e8ee] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e8ee] bg-[#f7f9ff]">
                <th className="text-left px-5 py-3.5 font-semibold text-[#43474f]">Nome</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#43474f] hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#43474f] hidden md:table-cell">Descrição</th>
                <th className="text-center px-5 py-3.5 font-semibold text-[#43474f]">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[#43474f]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f1f4f9]">
                    {[1,2,3,4,5].map((j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[#e5e8ee] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : categorias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-[#737780]">
                    <div className="flex flex-col items-center gap-3">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <path d="M5 10a4 4 0 014-4h7l4 4h11a4 4 0 014 4v16a4 4 0 01-4 4H9a4 4 0 01-4-4V10z" stroke="#c3c6d1" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      <p className="font-medium text-[#43474f]">Nenhuma categoria encontrada</p>
                      {busca && <button onClick={() => setBusca('')} className="text-[#0070ea] text-sm hover:underline">Limpar busca</button>}
                    </div>
                  </td>
                </tr>
              ) : (
                categorias.map((cat) => (
                  <tr key={cat.id} className="border-b border-[#f1f4f9] hover:bg-[#f7f9ff] transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#181c20]">{cat.nome}</span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <code className="text-xs bg-[#f1f4f9] text-[#43474f] px-2 py-1 rounded-lg">{cat.slug}</code>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-[#737780] max-w-xs truncate">
                      {cat.descricao || <span className="text-[#c3c6d1] italic">Sem descrição</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleAtivo(cat)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                          cat.ativo
                            ? 'bg-[#d4f5e2] text-[#1a6b3c] hover:bg-[#b8ecd0]'
                            : 'bg-[#e5e8ee] text-[#737780] hover:bg-[#d5d8e0]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.ativo ? 'bg-[#1a6b3c]' : 'bg-[#737780]'}`} />
                        {cat.ativo ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/categorias/${cat.id}/editar`)}
                          className="p-2 rounded-lg text-[#43474f] hover:bg-[#cce0ff] hover:text-[#003366] transition-colors"
                          title="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => { setDeleteError(null); setDeleteTarget(cat) }}
                          className="p-2 rounded-lg text-[#43474f] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors"
                          title="Excluir"
                        >
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l.8 9h7.4l.8-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      <AdminPagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />

      {/* Modal de exclusão */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir categoria"
        message={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir a categoria "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={!deleteError ? handleDelete : undefined}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
      />
    </div>
  )
}
