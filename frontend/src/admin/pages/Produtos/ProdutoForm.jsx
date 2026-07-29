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
  const cameraRef = useRef(null)

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
  const [previewBroken, setPreviewBroken] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const localPreviewRef = useRef(null)

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
        const imagensProduto = Array.isArray(p.imagens) ? p.imagens.filter(Boolean) : []
        const initialImages = imagensProduto.length > 0
          ? imagensProduto
          : (p.imagemPrincipal ? [p.imagemPrincipal] : [])
        const principal = p.imagemPrincipal || initialImages[0] || ''

        setGalleryImages(initialImages)
        setForm({
          nome:             p.nome             ?? '',
          slug:             p.slug             ?? '',
          descricao:        p.descricao        ?? '',
          sku:              p.sku              ?? '',
          preco:            String(p.preco     ?? ''),
          precoPromocional: p.precoPromocional != null ? String(p.precoPromocional) : '',
          estoque:          String(p.estoque   ?? 0),
          categoriaId:      String(p.categoriaId ?? ''),
          imagemPrincipal:  principal,
          destaque:         p.destaque         ?? false,
          ativo:            p.ativo            ?? true,
        })

        if (principal) {
          const normalizedPrincipal = normalizeImageUrl(principal) || null
          console.log('[ProdutoForm][setPreviewUrl] origem=load-edit', { nextPreviewUrl: normalizedPrincipal })
          setPreviewUrl(normalizedPrincipal)
          console.log('[ProdutoForm][setPreviewBroken] origem=load-edit -> false', { currentPreviewUrl: normalizedPrincipal })
          setPreviewBroken(false)
        }

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

  function openFilePicker() {
    fileRef.current?.click()
  }

  function openCameraPicker() {
    cameraRef.current?.click()
  }

  function revokeLocalPreviewIfAny() {
    if (localPreviewRef.current && localPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewRef.current)
    }
    localPreviewRef.current = null
  }

  function normalizeImageUrl(url) {
    if (!url) {
      console.log('[ProdutoForm][normalizeImageUrl] input vazio', { url })
      return ''
    }
    if (/^https?:\/\//i.test(url) || /^blob:/i.test(url) || /^data:/i.test(url)) {
      console.log('[ProdutoForm][normalizeImageUrl] url absoluta/blob/data', { input: url, output: url })
      return url
    }
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '')
    const normalized = url.startsWith('/') ? `${apiBase}${url}` : `${apiBase}/${url}`
    console.log('[ProdutoForm][normalizeImageUrl] url relativa normalizada', { input: url, apiBase, output: normalized })
    return normalized
  }

  function removeGalleryImage(indexToRemove) {
    setGalleryImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove)
      const nextPrincipal = next[0] || ''

      setForm((f) => ({
        ...f,
        imagemPrincipal: nextPrincipal,
      }))

      if (!nextPrincipal) {
        revokeLocalPreviewIfAny()
        console.log('[ProdutoForm][setPreviewUrl] origem=removeGalleryImage(empty)', { nextPreviewUrl: null })
        setPreviewUrl(null)
        console.log('[ProdutoForm][setPreviewBroken] origem=removeGalleryImage(empty) -> false', { currentPreviewUrl: null })
        setPreviewBroken(false)
      } else {
        const normalizedPrincipal = normalizeImageUrl(nextPrincipal) || null
        console.log('[ProdutoForm][setPreviewUrl] origem=removeGalleryImage', { nextPreviewUrl: normalizedPrincipal })
        setPreviewUrl(normalizedPrincipal)
        console.log('[ProdutoForm][setPreviewBroken] origem=removeGalleryImage -> false', { currentPreviewUrl: normalizedPrincipal })
        setPreviewBroken(false)
      }

      return next
    })
  }

  // ── Upload de imagem ───────────────────────────────────────────
  async function handleFileChange(e) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    // Preview local imediato (primeiro arquivo selecionado)
    const firstFile = files[0]
    revokeLocalPreviewIfAny()
    const localUrl = URL.createObjectURL(firstFile)
    localPreviewRef.current = localUrl
    console.log('[ProdutoForm][handleFileChange] preview local criado', {
      localUrl,
      fileName: firstFile.name,
      fileType: firstFile.type,
      fileSize: firstFile.size,
      selectedCount: files.length,
    })
    console.log('[ProdutoForm][setPreviewUrl] origem=handleFileChange(local)', { nextPreviewUrl: localUrl })
    setPreviewUrl(localUrl)
    console.log('[ProdutoForm][setPreviewBroken] origem=handleFileChange(local) -> false', { currentPreviewUrl: localUrl })
    setPreviewBroken(false)
    setUploadError(null)
    setUploading(true)

    try {
      const uploadedUrls = []

      for (const file of files) {
        const res = await adminUploadImagemProduto(file)
        const url = res.data?.url ?? ''
        const normalizedUrl = normalizeImageUrl(url)

        console.log('[ProdutoForm][handleFileChange] upload sucesso', {
          responseUrl: url,
          normalizedUrl,
          localUrl,
          fileName: file.name,
        })

        if (url) uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((prev) => {
          const next = [...prev, ...uploadedUrls]
          const principal = next[0] || ''
          setForm((f) => ({ ...f, imagemPrincipal: principal }))
          const normalizedPrincipal = normalizeImageUrl(principal) || null
          console.log('[ProdutoForm][setPreviewUrl] origem=handleFileChange(upload-sucesso)', {
            nextPreviewUrl: normalizedPrincipal,
          })
          setPreviewUrl(normalizedPrincipal)
          console.log('[ProdutoForm][setPreviewBroken] origem=handleFileChange(upload-sucesso) -> false', {
            currentPreviewUrl: normalizedPrincipal,
          })
          setPreviewBroken(false)
          return next
        })
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Falha no upload'
      setUploadError(msg)
      console.error('[ProdutoForm][handleFileChange] erro upload', { msg, err })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ── Validação ──────────────────────────────────────────────────
  function validate() {
    const er = {}
    if (!form.nome.trim()) er.nome = 'Informe o nome.'
    if (!form.slug.trim()) er.slug = 'Informe o slug.'

    const precoNum = Number(form.preco)
    if (Number.isNaN(precoNum) || precoNum <= 0) er.preco = 'Preço deve ser maior que zero.'

    const promo = form.precoPromocional.trim()
    if (promo) {
      const promoNum = Number(promo)
      if (Number.isNaN(promoNum) || promoNum < 0) er.precoPromocional = 'Preço promocional inválido.'
      else if (!Number.isNaN(precoNum) && promoNum >= precoNum) er.precoPromocional = 'Promo deve ser menor que o preço.'
    }

    const est = Number(form.estoque)
    if (!Number.isInteger(est) || est < 0) er.estoque = 'Estoque inválido.'

    if (!form.categoriaId) er.categoriaId = 'Selecione uma categoria.'

    if (form.imagemPrincipal && !/^https?:\/\//i.test(normalizeImageUrl(form.imagemPrincipal))) {
      // aceita relativa também, pois normaliza
    }

    setErrors(er)
    return Object.keys(er).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)

    if (!validate()) return

    const payload = {
      nome: form.nome.trim(),
      slug: form.slug.trim(),
      descricao: form.descricao?.trim() || undefined,
      sku: form.sku?.trim() || undefined,
      preco: Number(form.preco),
      precoPromocional: form.precoPromocional.trim() ? Number(form.precoPromocional) : null,
      estoque: Number(form.estoque),
      categoriaId: Number(form.categoriaId),
      imagemPrincipal: galleryImages[0] || undefined,
      imagens: galleryImages,
      destaque: !!form.destaque,
      ativo: !!form.ativo,
    }

    try {
      setSaving(true)
      if (isEdit) {
        await adminUpdateProduto(parseInt(id), payload)
      } else {
        await adminCreateProduto(payload)
      }
      navigate('/admin/produtos')
    } catch (err) {
      setApiError(err?.response?.data?.message || err.message)
    } finally {
      setSaving(false)
    }
  }

  // Limpa blob URL ao desmontar
  useEffect(() => {
    return () => revokeLocalPreviewIfAny()
  }, [])

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 animate-pulse">
          <div className="h-7 w-56 bg-[#f1f4f9] rounded mb-6" />
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-11 bg-[#f1f4f9] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const precoNum = Number(form.preco)
  const precoFmt = !Number.isNaN(precoNum) && form.preco !== '' ? formatPrice(precoNum) : 'R$ 0,00'

  const promoNum = Number(form.precoPromocional)
  const promoFmt = form.precoPromocional !== '' && !Number.isNaN(promoNum) ? formatPrice(promoNum) : '—'

  return (
    <div className="p-4 md:p-6 bg-[#f8f9fb] min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#181c20]">
          {isEdit ? 'Editar Produto' : 'Novo Produto'}
        </h1>
        <p className="text-sm text-[#737780] mt-1">
          Preencha as informações para {isEdit ? 'atualizar' : 'cadastrar'} o produto no catálogo.
        </p>
      </div>

      {/* Alertas */}
      {apiError && (
        <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff2f0] text-[#ba1a1a] px-4 py-3 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Coluna principal ────────────────────────────────────── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-5">
          <h2 className="text-lg font-semibold text-[#181c20]">Informações básicas</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">Nome *</label>
              <input
                value={form.nome}
                onChange={handleNomeChange}
                placeholder="Ex.: Smartphone X"
                className={`w-full border ${errors.nome ? 'border-[#ba1a1a]' : 'border-[#e5e8ee]'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all`}
              />
              {errors.nome && <p className="text-xs text-[#ba1a1a] mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">Slug *</label>
              <input
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="smartphone-x"
                className={`w-full border ${errors.slug ? 'border-[#ba1a1a]' : 'border-[#e5e8ee]'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all`}
              />
              {errors.slug && <p className="text-xs text-[#ba1a1a] mt-1">{errors.slug}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">SKU</label>
              <input
                value={form.sku}
                onChange={set('sku')}
                placeholder="ABC-123"
                className="w-full border border-[#e5e8ee] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">Categoria *</label>
              <select
                value={form.categoriaId}
                onChange={set('categoriaId')}
                className={`w-full border ${errors.categoriaId ? 'border-[#ba1a1a]' : 'border-[#e5e8ee]'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all bg-white`}
              >
                <option value="">Selecione...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {errors.categoriaId && <p className="text-xs text-[#ba1a1a] mt-1">{errors.categoriaId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">Preço *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.preco}
                onChange={set('preco')}
                placeholder="0,00"
                className={`w-full border ${errors.preco ? 'border-[#ba1a1a]' : 'border-[#e5e8ee]'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all`}
              />
              <p className="text-xs text-[#737780] mt-1">Prévia: {precoFmt}</p>
              {errors.preco && <p className="text-xs text-[#ba1a1a] mt-1">{errors.preco}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">Preço promocional</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precoPromocional}
                onChange={set('precoPromocional')}
                placeholder="0,00"
                className={`w-full border ${errors.precoPromocional ? 'border-[#ba1a1a]' : 'border-[#e5e8ee]'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all`}
              />
              <p className="text-xs text-[#737780] mt-1">Prévia: {promoFmt}</p>
              {errors.precoPromocional && <p className="text-xs text-[#ba1a1a] mt-1">{errors.precoPromocional}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#737780] mb-1.5">Estoque *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.estoque}
                onChange={set('estoque')}
                placeholder="0"
                className={`w-full border ${errors.estoque ? 'border-[#ba1a1a]' : 'border-[#e5e8ee]'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all`}
              />
              {errors.estoque && <p className="text-xs text-[#ba1a1a] mt-1">{errors.estoque}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#737780] mb-1.5">Descrição</label>
            <textarea
              rows={6}
              value={form.descricao}
              onChange={set('descricao')}
              placeholder="Descreva características técnicas, materiais, garantia, etc."
              className="w-full border border-[#e5e8ee] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all resize-y"
            />
          </div>
        </div>

        {/* ── Coluna lateral ──────────────────────────────────────── */}
        <div className="space-y-5">
          {/* ── Seção: Imagens do Produto ────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6 space-y-4">
            <h3 className="font-semibold text-[#181c20] text-sm border-b border-[#f1f4f9] pb-3">Imagens do Produto</h3>

            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openFilePicker()}
              className="border border-dashed border-[#c3c6d1] rounded-xl p-4 bg-[#f8f9fb] hover:bg-[#f1f4f9] cursor-pointer transition-colors"
            >
              {uploading ? (
                <div className="flex items-center gap-3 text-sm text-[#43474f]">
                  <div className="w-4 h-4 border-2 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
                  Fazendo upload...
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-[#f1f4f9] rounded-xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#c3c6d1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#43474f]">Clique para fazer upload</p>
                    <p className="text-xs text-[#737780] mt-1">JPEG, PNG ou WebP — máx. 5MB</p>
                    <p className="text-xs text-[#737780] mt-1">Você pode selecionar várias imagens de uma vez.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={openCameraPicker}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#0070ea]/20 bg-[#f7f9ff] px-3 py-2.5 text-sm font-semibold text-[#0070ea] hover:bg-[#eef5ff] transition-colors"
              >
                <span aria-hidden="true">📷</span>
                Tirar foto com câmera
              </button>
              <button
                type="button"
                onClick={openFilePicker}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5e8ee] bg-white px-3 py-2.5 text-sm font-semibold text-[#43474f] hover:bg-[#f7f9ff] transition-colors"
              >
                <span aria-hidden="true">🖼️</span>
                Escolher da galeria/arquivos
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadError && (
              <p className="text-xs text-[#ba1a1a]">Erro no upload: {uploadError}</p>
            )}

            {galleryImages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#737780]">Galeria ({galleryImages.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryImages.map((img, index) => {
                    const normalized = normalizeImageUrl(img) || ''
                    const isPrincipal = index === 0
                    return (
                      <div key={`${img}-${index}`} className="rounded-xl border border-[#e5e8ee] bg-[#f8f9fb] p-2 space-y-2">
                        <div className="aspect-square rounded-lg overflow-hidden bg-[#f1f4f9]">
                          {normalized ? (
                            <img
                              src={normalized}
                              alt={`Imagem ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(ev) => {
                                console.log('[ProdutoForm][gallery-image:onError]', { original: img, normalized })
                                ev.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : null}
                        </div>
                        {isPrincipal && (
                          <p className="text-[11px] font-semibold text-[#0070ea]">Principal ⭐</p>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="w-full rounded-lg border border-[#ffdad6] bg-[#fff2f0] px-2 py-1.5 text-[11px] font-semibold text-[#ba1a1a] hover:bg-[#ffe7e3] transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Preview principal */}
            {previewUrl && !previewBroken && (
              <div className="rounded-xl overflow-hidden border border-[#e5e8ee] bg-[#f8f9fb]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-52 object-cover"
                  onLoad={() => {
                    console.log('[ProdutoForm][preview:onLoad]', {
                      previewUrl,
                      localPreviewRef: localPreviewRef.current,
                    })
                    console.log('[ProdutoForm][setPreviewBroken] origem=preview:onLoad -> false', { currentPreviewUrl: previewUrl })
                    setPreviewBroken(false)
                  }}
                  onError={() => {
                    console.log('[ProdutoForm][preview:onError]', {
                      previewUrl,
                      localPreviewRef: localPreviewRef.current,
                    })
                    console.log('[ProdutoForm][setPreviewBroken] origem=preview:onError -> true', { currentPreviewUrl: previewUrl })
                    setPreviewBroken(true)
                  }}
                />
              </div>
            )}
            {previewUrl && previewBroken && (
              <div className="rounded-xl border border-[#ffdad6] bg-[#fff2f0] p-3 text-xs text-[#ba1a1a]">
                Não foi possível carregar a imagem de preview.
              </div>
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
                  const manualUrl = e.target.value
                  const normalizedManualUrl = normalizeImageUrl(manualUrl) || null
                  console.log('[ProdutoForm][manual-url:onChange]', {
                    manualUrl,
                    normalizedManualUrl,
                  })

                  setForm((f) => ({ ...f, imagemPrincipal: manualUrl }))

                  if (!manualUrl.trim()) {
                    setGalleryImages([])
                    revokeLocalPreviewIfAny()
                    console.log('[ProdutoForm][setPreviewUrl] origem=manual-url:onChange(empty)', { nextPreviewUrl: null })
                    setPreviewUrl(null)
                    console.log('[ProdutoForm][setPreviewBroken] origem=manual-url:onChange(empty) -> false', {
                      currentPreviewUrl: null,
                    })
                    setPreviewBroken(false)
                    return
                  }

                  setGalleryImages((prev) => {
                    const filtered = prev.filter((img) => img !== manualUrl)
                    return [manualUrl, ...filtered]
                  })

                  console.log('[ProdutoForm][setPreviewUrl] origem=manual-url:onChange', { nextPreviewUrl: normalizedManualUrl })
                  setPreviewUrl(normalizedManualUrl)
                  console.log('[ProdutoForm][setPreviewBroken] origem=manual-url:onChange -> false', {
                    currentPreviewUrl: normalizedManualUrl,
                  })
                  setPreviewBroken(false)
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
        </div>
      </form>
    </div>
  )
}
