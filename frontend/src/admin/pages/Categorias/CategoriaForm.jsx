import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  adminGetCategorias,
  adminCreateCategoria,
  adminUpdateCategoria,
} from '../../../services/adminApi'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const EMPTY = { nome: '', slug: '', descricao: '', imagem: '', ativo: true }

export default function CategoriaForm() {
  const { id }    = useParams()          // undefined = criar, number = editar
  const navigate  = useNavigate()
  const isEdit    = !!id

  const [form,       setForm]       = useState(EMPTY)
  const [slugManual, setSlugManual] = useState(false)  // true quando usuário editou slug manualmente
  const [loading,    setLoading]    = useState(isEdit)
  const [saving,     setSaving]     = useState(false)
  const [errors,     setErrors]     = useState({})
  const [apiError,   setApiError]   = useState(null)

  // ── Carregar dados para edição ─────────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    adminGetCategorias()
      .then((res) => {
        const cat = res.data?.find((c) => c.id === parseInt(id))
        if (!cat) throw new Error('Categoria não encontrada.')
        setForm({
          nome:     cat.nome     ?? '',
          slug:     cat.slug     ?? '',
          descricao:cat.descricao?? '',
          imagem:   cat.imagem   ?? '',
          ativo:    cat.ativo    ?? true,
        })
        setSlugManual(true) // em edição, não auto-gerar slug
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // ── Auto-gerar slug a partir do nome ──────────────────────────
  function handleNomeChange(e) {
    const nome = e.target.value
    setForm((f) => ({
      ...f,
      nome,
      slug: slugManual ? f.slug : slugify(nome),
    }))
    if (errors.nome) setErrors((e) => ({ ...e, nome: null }))
  }

  function handleSlugChange(e) {
    setSlugManual(true)
    setForm((f) => ({ ...f, slug: e.target.value }))
    if (errors.slug) setErrors((e) => ({ ...e, slug: null }))
  }

  function set(field) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: val }))
      if (errors[field]) setErrors((er) => ({ ...er, [field]: null }))
    }
  }

  // ── Validação client-side ──────────────────────────────────────
  function validate() {
    const errs = {}
    if (!form.nome.trim())  errs.nome = 'Nome é obrigatório.'
    if (form.nome.trim().length < 2) errs.nome = 'Nome deve ter no mínimo 2 caracteres.'
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug deve conter apenas letras minúsculas, números e hífens.'
    if (form.imagem && !/^https?:\/\/.+/.test(form.imagem)) errs.imagem = 'URL de imagem inválida.'
    return errs
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setApiError(null)

    const payload = {
      nome:     form.nome.trim(),
      slug:     form.slug.trim() || undefined,
      descricao:form.descricao.trim() || undefined,
      imagem:   form.imagem.trim()    || undefined,
      ativo:    form.ativo,
    }

    try {
      if (isEdit) {
        await adminUpdateCategoria(parseInt(id), payload)
      } else {
        await adminCreateCategoria(payload)
      }
      navigate('/admin/categorias', {
        state: { toast: `Categoria ${isEdit ? 'atualizada' : 'criada'} com sucesso.` },
      })
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/categorias"
          className="p-2 rounded-xl hover:bg-[#e5e8ee] transition-colors text-[#43474f]"
          title="Voltar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[#181c20]">
            {isEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <p className="text-sm text-[#737780]">
            {isEdit ? 'Atualize os dados da categoria.' : 'Preencha os dados para criar uma nova categoria.'}
          </p>
        </div>
      </div>

      {/* Erro da API */}
      {apiError && (
        <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {apiError}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-5">

        {/* Nome */}
        <div>
          <label className="block text-sm font-semibold text-[#181c20] mb-1.5">
            Nome <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={handleNomeChange}
            placeholder="Ex: Máquinas de Lavar"
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
              ${errors.nome
                ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'
              }`}
          />
          {errors.nome && <p className="text-xs text-[#ba1a1a] mt-1">{errors.nome}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-[#181c20] mb-1.5">
            Slug
            <span className="text-xs font-normal text-[#737780] ml-2">(gerado automaticamente)</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={handleSlugChange}
            placeholder="ex: maquinas-de-lavar"
            className={`w-full border rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all
              ${errors.slug
                ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'
              }`}
          />
          {errors.slug && <p className="text-xs text-[#ba1a1a] mt-1">{errors.slug}</p>}
          <p className="text-xs text-[#737780] mt-1">Apenas letras minúsculas, números e hífens.</p>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={set('descricao')}
            placeholder="Descrição opcional da categoria..."
            rows={3}
            className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all resize-none"
          />
        </div>

        {/* URL da imagem */}
        <div>
          <label className="block text-sm font-semibold text-[#181c20] mb-1.5">URL da Imagem</label>
          <input
            type="url"
            value={form.imagem}
            onChange={set('imagem')}
            placeholder="https://exemplo.com/imagem.jpg"
            className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
              ${errors.imagem
                ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'
              }`}
          />
          {errors.imagem && <p className="text-xs text-[#ba1a1a] mt-1">{errors.imagem}</p>}
          {form.imagem && !errors.imagem && (
            <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-[#e5e8ee]">
              <img
                src={form.imagem}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3 p-4 bg-[#f7f9ff] rounded-xl border border-[#e5e8ee]">
          <input
            id="ativo"
            type="checkbox"
            checked={form.ativo}
            onChange={set('ativo')}
            className="w-4 h-4 accent-[#0070ea] cursor-pointer"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-[#181c20] cursor-pointer select-none">
            Categoria ativa
            <span className="block text-xs text-[#737780] font-normal">
              Categorias inativas não aparecem no catálogo público.
            </span>
          </label>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Link
            to="/admin/categorias"
            className="flex-1 py-3 rounded-xl border border-[#e5e8ee] text-sm font-semibold text-[#43474f] hover:bg-[#f7f9ff] transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#0070ea] text-white text-sm font-semibold hover:bg-[#0059bb] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Categoria'}
          </button>
        </div>
      </form>
    </div>
  )
}
