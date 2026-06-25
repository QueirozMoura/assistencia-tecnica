import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  adminGetProdutos,
  adminDeleteProduto,
  adminUpdateProduto,
  adminGetCategorias,
} from '../../../services/adminApi'
import { getPrimaryImage } from '../../../services/imageMap'
import { formatPrice }     from '../../../utils/formatPrice'
import ConfirmModal        from '../../components/ConfirmModal'
import AdminPagination     from '../../components/AdminPagination'
import AdminSearchBar      from '../../components/AdminSearchBar'

const LIMIT = 10

export default function ProdutosList() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [produtos,    setProdutos]    = useState([])
  const [meta,        setMeta]        = useState({ total: 0, totalPages: 1 })
  const [categorias,  setCategorias]  = useState([])
  const [page,        setPage]        = useState(1)
  const [busca,       setBusca]       = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('')   // '' | 'true' | 'false'
  const [filtroCat,   setFiltroCat]   = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState(null)

  const [toast, setToast] = useState(location.state?.toast ?? null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Limpar state do navigate após exibir toast
  useEffect(() => {
    if (location.state?.toast) {
      window.history.replaceState({}, '')
      setTimeout(() => setToast(null), 3000)
    }
  }, [location.state])

  // Carregar categorias (uma vez)
  useEffect(() => {
    adminGetCategorias().then((r) => setCategorias(r.data ?? [])).catch(() => {})
  }, [])

  // Carregar produtos
  const fetchProdutos = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = {
      page,
      limit: LIMIT,
      ...(busca       && { busca }),
      ...(filtroCat   && { categoriaId: parseInt(filtroCat) }),
      ...(filtroAtivo !== '' && { ativo: filtroAtivo === 'true' }),
    }
    // Sobrescrever ativo padrão do backend (que filtra só ativos)
    if (filtroAtivo === '') params.ativo = undefined

    adminGetProdutos(params)
      .then((res) => {
        setProdutos(res.data ?? [])
        setMeta(res.meta ?? { total: 0, totalPages: 1 })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, busca, filtroCat, filtroAtivo])

  useEffect(() => { fetchProdutos() }, [fetchProdutos])
  useEffect(() => { setPage(1) }, [busca, filtroCat, filtroAtivo])

  // Toggle ativo
  async function handleToggleAtivo(prod) {
    try {
      await adminUpdateProduto(prod.id, { ativo: !prod.ativo })
      showToast(`Produto ${!prod.ativo ? 'ativado' : 'desativado'}.`)
      fetchProdutos()
    } catch (err) { setError(err.message) }
  }

  // Toggle destaque
  async function handleToggleDestaque(prod) {
    try {
      await adminUpdateProduto(prod.id, { destaque: !prod.destaque })
      showToast(`Destaque ${!prod.destaque ? 'ativado' : 'removido'}.`)
      fetchProdutos()
    } catch (err) { setError(err.message) }
  }

  // Excluir
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await adminDeleteProduto(deleteTarget.id)
      setDeleteTarget(null)
      showToast('Produto excluído com sucesso.')
      fetchProdutos()
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
        <div className="fixed top-5 right-5 z-50 bg-[#1a6b3c] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
          ✓ {toast}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[#181c20]">Produtos</h2>
          <p className="text-sm text-[#737780]">{meta.total} produto{meta.total !== 1 ? 's' : ''} encontrado{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="flex items-center gap-2 bg-[#0070ea] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0059bb] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Novo Produto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <AdminSearchBar value={busca} onChange={setBusca} placeholder="Buscar por nome, SKU..." />
        </div>
        <select
          value={filtroCat}
          onChange={(e) => setFiltroCat(e.target.value)}
          className="border border-[#e5e8ee] rounded-xl px-3 py-2.5 text-sm text-[#43474f] outline-none focus:border-[#0070ea] bg-white"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          value={filtroAtivo}
          onChange={(e) => setFiltroAtivo(e.target.value)}
          className="border border-[#e5e8ee] rounded-xl px-3 py-2.5 text-sm text-[#43474f] outline-none focus:border-[#0070ea] bg-white"
        >
          <option value="">Todos os status</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
          <button onClick={fetchProdutos} className="ml-auto underline font-medium">Tentar novamente</button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#e5e8ee] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e8ee] bg-[#f7f9ff]">
                <th className="text-left px-5 py-3.5 font-semibold text-[#43474f]">Produto</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#43474f] hidden md:table-cell">Categoria</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[#43474f] hidden sm:table-cell">Preço</th>
                <th className="text-center px-5 py-3.5 font-semibold text-[#43474f] hidden lg:table-cell">Estoque</th>
                <th className="text-center px-5 py-3.5 font-semibold text-[#43474f]">Status</th>
                <th className="text-center px-5 py-3.5 font-semibold text-[#43474f] hidden lg:table-cell">Destaque</th>
                <th className="text-right px-5 py-3.5 font-semibold text-[#43474f]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f1f4f9]">
                    {[1,2,3,4,5,6,7].map((j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[#e5e8ee] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <path d="M5 10h30v25H5z" stroke="#c3c6d1" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M5 10l5-5h20l5 5" stroke="#c3c6d1" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      <p className="font-medium text-[#43474f]">Nenhum produto encontrado</p>
                      {(busca || filtroCat || filtroAtivo) && (
                        <button
                          onClick={() => { setBusca(''); setFiltroCat(''); setFiltroAtivo('') }}
                          className="text-[#0070ea] text-sm hover:underline"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                produtos.map((prod) => {
                  const img = prod.imagemPrincipal || getPrimaryImage(prod)
                  return (
                    <tr key={prod.id} className="border-b border-[#f1f4f9] hover:bg-[#f7f9ff] transition-colors">
                      {/* Produto */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f1f4f9] flex-shrink-0 border border-[#e5e8ee]">
                            {img ? (
                              <img src={img} alt={prod.nome} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none' }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M2 12l4-5 3 3.5 2-2.5 3 4H2z" fill="#c3c6d1"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#181c20] truncate max-w-[180px]">{prod.nome}</p>
                            {prod.sku && <p className="text-xs text-[#737780]">SKU: {prod.sku}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Categoria */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs bg-[#f1f4f9] text-[#43474f] px-2.5 py-1 rounded-lg font-medium">
                          {prod.categoria?.nome ?? '—'}
                        </span>
                      </td>
                      {/* Preço */}
                      <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                        <div>
                          <p className="font-semibold text-[#181c20]">{formatPrice(prod.preco)}</p>
                          {prod.precoPromocional && (
                            <p className="text-xs text-[#1a6b3c]">{formatPrice(prod.precoPromocional)}</p>
                          )}
                        </div>
                      </td>
                      {/* Estoque */}
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                        <span className={`text-sm font-semibold ${prod.estoque === 0 ? 'text-[#ba1a1a]' : prod.estoque <= 5 ? 'text-[#d4a017]' : 'text-[#1a6b3c]'}`}>
                          {prod.estoque}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleAtivo(prod)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            prod.ativo
                              ? 'bg-[#d4f5e2] text-[#1a6b3c] hover:bg-[#b8ecd0]'
                              : 'bg-[#e5e8ee] text-[#737780] hover:bg-[#d5d8e0]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prod.ativo ? 'bg-[#1a6b3c]' : 'bg-[#737780]'}`} />
                          {prod.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      {/* Destaque */}
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                        <button
                          onClick={() => handleToggleDestaque(prod)}
                          title={prod.destaque ? 'Remover destaque' : 'Marcar como destaque'}
                          className={`p-1.5 rounded-lg transition-colors ${prod.destaque ? 'text-[#d4a017] bg-[#fff3cd]' : 'text-[#c3c6d1] hover:text-[#d4a017] hover:bg-[#fff3cd]'}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill={prod.destaque ? 'currentColor' : 'none'}>
                            <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1L2 5.3l4.2-.7L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </td>
                      {/* Ações */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/produtos/${prod.id}/editar`)}
                            className="p-2 rounded-lg text-[#43474f] hover:bg-[#cce0ff] hover:text-[#003366] transition-colors"
                            title="Editar"
                          >
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                              <path d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => { setDeleteError(null); setDeleteTarget(prod) }}
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />

      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir produto"
        message={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir "${deleteTarget?.nome}"? Se o produto estiver em pedidos, será apenas desativado.`
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
