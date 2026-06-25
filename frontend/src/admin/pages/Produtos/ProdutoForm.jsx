import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  adminGetProdutoById,
  adminCreateProduto,
  adminUpdateProduto,
  adminGetCategorias,
  adminUploadImagemProduto,
} from '../../../services/adminApi'
import { formatPrice } from '../../../utils/formatPrice'

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

const EMPTY = {
  nome: '', slug: '', descricao: '', sku: '',
  preco: '', precoPromocional: '', estoque: '0',
  categoriaId: '', imagemPrincipal: '',
  destaque: false, ativo: true,
}

export default function ProdutoForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = !!id
  const fileRef  = useRef(null)

  const [form,       setForm]       = useState(EMPTY)
  const [slugManual, setSlugManual] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [loading,    setLoading]    = useState(isEdit)
  const [saving,     setSaving]     = useState(false)
  const [errors,     setErrors]     = useState({})
  const [apiError,   setApiError]   = useState(null)

  // Upload
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState(null)
  const [previewUrl,   setPreviewUrl]   = useState(null)

  // ── Carregar categorias ────────────────────────────────────────
  useEffect(() => {
    adminGetCategorias()
      .then((r) => setCategorias(r.data ?? []))
      .catch(() => {})
  }, [])

  // ── Carregar produto para edição ───────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    adminGetProdutoById(parseInt(id))
      .then((res) => {
        const p = res.data
        setForm({
          nome:             p.nome             ?? '',
          slug:             p.slug             ?? '',
          descricao:        p.descricao        ?? '',
          sku:              p.sku              ?? '',
          preco:            String(p.preco     ?? ''),
          precoPromocional: p.precoPromocional != null ? String(p.precoPromocional) : '',
          estoque:          String(p.estoque   ?? 0),
          categoriaId:      String(p.categoriaId ?? ''),
          imagemPrincipal:  p.imagemPrincipal  ?? '',
          destaque:         p.destaque         ?? false,
          ativo:            p.ativo            ?? true,
        })
        if (p.imagemPrincipal) setPreviewUrl(p.imagemPrincipal)
        setSlugManual(true)
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // ── Helpers de campo ───────────────────────────────────────────
  function handleNomeChange(e) {
    const nome = e.target.value
    setForm((f) => ({ ...f, nome, slug: slugManual ? f.slug : slugify(nome) }))
    clearErr('nome')
  }

  function handleSlugChange(e) {
    setSlugManual(true)
    setForm((f) => ({ ...f, slug: e.target.value }))
    clearErr('slug')
  }

  function set(field) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: val }))
      clearErr(field)
    }
  }

  function clearErr(field) {
    setErrors((er) => ({ ...er, [field]: null }))
  }

  // ── Upload de imagem ───────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local imediato
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploadError(null)
    setUploading(true)

    try {
      const res = await adminUploadImagemProduto(file)
      const url = res.data?.url ?? ''
      setForm((f) => ({ ...f, imagemPrincipal: url }))
      setPreviewUrl(url)
    } catch (err) {
      setUploadError(err.message)
      setPreviewUrl(form.imagemPrincipal || null)
    } finally {
      setUploading(false)
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleRemoveImage() {
    setPreviewUrl(null)
    setForm((f) => ({ ...f, imagemPrincipal: '' }))
    setUploadError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Validação ──────────────────────────────────────────────────
  function validate() {
    const errs = {}
    if (!form.nome.trim())                    errs.nome = 'Nome é obrigatório.'
    if (form.nome.trim().length < 2)          errs.nome = 'Nome deve ter no mínimo 2 caracteres.'
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug inválido.'
    if (!form.preco || isNaN(parseFloat(form.preco)) || parseFloat(form.preco) <= 0)
      errs.preco = 'Preço deve ser um valor positivo.'
    if (form.precoPromocional && (isNaN(parseFloat(form.precoPromocional)) || parseFloat(form.precoPromocional) <= 0))
      errs.precoPromocional = 'Preço promocional deve ser positivo.'
    if (isNaN(parseInt(form.estoque)) || parseInt(form.estoque) < 0)
      errs.estoque = 'Estoque deve ser 0 ou maior.'
    if (!form.categoriaId)                    errs.categoriaId = 'Selecione uma categoria.'
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
      nome:             form.nome.trim(),
      slug:             form.slug.trim() || undefined,
      descricao:        form.descricao.trim() || undefined,
      sku:              form.sku.trim()       || undefined,
      preco:            parseFloat(form.preco),
      precoPromocional: form.precoPromocional ? parseFloat(form.precoPromocional) : null,
      estoque:          parseInt(form.estoque),
      categoriaId:      parseInt(form.categoriaId),
      imagemPrincipal:  form.imagemPrincipal  || undefined,
      destaque:         form.destaque,
      ativo:            form.ativo,
    }

    try {
      if (isEdit) {
        await adminUpdateProduto(parseInt(id), payload)
      } else {
        await adminCreateProduto(payload)
      }
      navigate('/admin/produtos', {
        state: { toast: `Produto ${isEdit ? 'atualizado' : 'criado'} com sucesso.` },
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

  const precoNum = parseFloat(form.preco) || 0
  const promoNum = parseFloat(form.precoPromocional) || 0

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link to="/admin/produtos" className="p-2 rounded-xl hover:bg-[#e5e8ee] transition-colors text-[#43474f]" title="Voltar">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <h2 className="text-lg font-bold text-[#181c20]">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
          <p className="text-sm text-[#737780]">{isEdit ? 'Atualize os dados do produto.' : 'Preencha os dados para criar um novo produto.'}</p>
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

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Seção: Informações básicas ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-5">
          <h3 className="font-semibold text-[#181c20] text-sm border-b border-[#f1f4f9] pb-3">Informações Básicas</h3>

          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-[#181c20] mb-1.5">
              Nome <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text" value={form.nome} onChange={handleNomeChange}
              placeholder="Ex: Máquina de Lavar Brastemp 11kg"
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
                ${errors.nome ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
            />
            {errors.nome && <p className="text-xs text-[#ba1a1a] mt-1">{errors.nome}</p>}
          </div>

          {/* Slug + SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">
                Slug <span className="text-xs font-normal text-[#737780]">(auto)</span>
              </label>
              <input
                type="text" value={form.slug} onChange={handleSlugChange}
                placeholder="maquina-lavar-brastemp-11kg"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all
                  ${errors.slug ? 'border-[#ba1a1a]' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.slug && <p className="text-xs text-[#ba1a1a] mt-1">{errors.slug}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">SKU</label>
              <input
                type="text" value={form.sku} onChange={set('sku')}
                placeholder="BWK11AB"
                className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Descrição</label>
            <textarea
              value={form.descricao} onChange={set('descricao')}
              placeholder="Descrição detalhada do produto..."
              rows={4}
              className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all resize-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-semibold text-[#181c20] mb-1.5">
              Categoria <span className="text-[#ba1a1a]">*</span>
            </label>
            <select
              value={form.categoriaId} onChange={set('categoriaId')}
              className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all bg-white
                ${errors.categoriaId ? 'border-[#ba1a1a]' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
            >
              <option value="">Selecione uma categoria...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {errors.categoriaId && <p className="text-xs text-[#ba1a1a] mt-1">{errors.categoriaId}</p>}
          </div>
        </div>

        {/* ── Seção: Preços e Estoque ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-5">
          <h3 className="font-semibold text-[#181c20] text-sm border-b border-[#f1f4f9] pb-3">Preços e Estoque</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Preço */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">
                Preço (R$) <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="number" step="0.01" min="0" value={form.preco} onChange={set('preco')}
                placeholder="0,00"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
                  ${errors.preco ? 'border-[#ba1a1a]' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.preco && <p className="text-xs text-[#ba1a1a] mt-1">{errors.preco}</p>}
            </div>

            {/* Preço Promocional */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Preço Promocional (R$)</label>
              <input
                type="number" step="0.01" min="0" value={form.precoPromocional} onChange={set('precoPromocional')}
                placeholder="0,00"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
                  ${errors.precoPromocional ? 'border-[#ba1a1a]' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.precoPromocional && <p className="text-xs text-[#ba1a1a] mt-1">{errors.precoPromocional}</p>}
            </div>

            {/* Estoque */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Estoque</label>
              <input
                type="number" step="1" min="0" value={form.estoque} onChange={set('estoque')}
                placeholder="0"
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all
                  ${errors.estoque ? 'border-[#ba1a1a]' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.estoque && <p className="text-xs text-[#ba1a1a] mt-1">{errors.estoque}</p>}
            </div>
          </div>

          {/* Preview de preço */}
          {precoNum > 0 && (
            <div className="bg-[#f7f9ff] rounded-xl p-4 border border-[#e5e8ee] text-sm">
              <p className="text-[#737780] mb-1">Preview do preço:</p>
              <div className="flex items-baseline gap-3">
                {promoNum > 0 && promoNum < precoNum && (
                  <span className="text-[#737780] line-through text-sm">{formatPrice(precoNum)}</span>
                )}
                <span className="text-xl font-bold text-[#003366]">
                  {formatPrice(promoNum > 0 && promoNum < precoNum ? promoNum : precoNum)}
                </span>
                {promoNum > 0 && promoNum < precoNum && (
                  <span className="text-xs font-bold text-white bg-[#ba1a1a] px-2 py-0.5 rounded-full">
                    -{Math.round(((precoNum - promoNum) / precoNum) * 100)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Seção: Imagem ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-4">
          <h3 className="font-semibold text-[#181c20] text-sm border-b border-[#f1f4f9] pb-3">Imagem Principal</h3>

          {/* Preview */}
          {previewUrl ? (
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-[#e5e8ee] group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none' }} />
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-[#ba1a1a] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  title="Remover imagem"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2L2 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[#c3c6d1] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#0070ea] hover:bg-[#f7f9ff] transition-all"
            >
              <div className="w-12 h-12 bg-[#f1f4f9] rounded-xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#c3c6d1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#43474f]">Clique para fazer upload</p>
                <p className="text-xs text-[#737780] mt-1">JPEG, PNG ou WebP — máx. 5MB</p>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploadError && (
            <p className="text-xs text-[#ba1a1a]">Erro no upload: {uploadError}</p>
          )}

          {/* URL manual (fallback) */}
          <div>
            <label className="block text-xs font-semibold text-[#737780] mb-1.5">
              Ou informe a URL da imagem manualmente
            </label>
            <input
              type="url"
              value={form.imagemPrincipal}
              onChange={(e) => {
                setForm((f) => ({ ...f, imagemPrincipal: e.target.value }))
                setPreviewUrl(e.target.value || null)
              }}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full border border-[#e5e8ee] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all"
            />
          </div>
        </div>

        {/* ── Seção: Configurações ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-4">
          <h3 className="font-semibold text-[#181c20] text-sm border-b border-[#f1f4f9] pb-3">Configurações</h3>

          <div className="space-y-3">
            {/* Ativo */}
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f7f9ff] cursor-pointer transition-colors">
              <input
                type="checkbox" checked={form.ativo} onChange={set('ativo')}
                className="w-4 h-4 accent-[#0070ea] cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-[#181c20]">Produto ativo</p>
                <p className="text-xs text-[#737780]">Produtos inativos não aparecem no catálogo público.</p>
              </div>
            </label>

            {/* Destaque */}
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f7f9ff] cursor-pointer transition-colors">
              <input
                type="checkbox" checked={form.destaque} onChange={set('destaque')}
                className="w-4 h-4 accent-[#0070ea] cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-[#181c20]">Produto em destaque</p>
                <p className="text-xs text-[#737780]">Exibido na seção "Produtos em Destaque" da Home.</p>
              </div>
            </label>
          </div>
        </div>

        {/* ── Botões ─────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link
            to="/admin/produtos"
            className="flex-1 py-3 rounded-xl border border-[#e5e8ee] text-sm font-semibold text-[#43474f] hover:bg-[#f7f9ff] transition-colors text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 py-3 rounded-xl bg-[#0070ea] text-white text-sm font-semibold hover:bg-[#0059bb] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {uploading ? 'Aguardando upload...' : isEdit ? 'Salvar Alterações' : 'Criar Produto'}
          </button>
        </div>
      </form>
    </div>
  )
}
