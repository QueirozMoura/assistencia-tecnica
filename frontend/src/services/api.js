// ─────────────────────────────────────────────
// Camada de serviço centralizada — API REST
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Função base de requisição.
 * Injeta automaticamente o Bearer token do localStorage quando disponível.
 * Endpoints públicos continuam funcionando normalmente (token ausente = sem header).
 */
async function request(path, options = {}) {
  const token = localStorage.getItem('admin_token')

  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.message || `Erro ${res.status}`)
    err.status = res.status
    throw err
  }

  return res.json()
}

// ─────────────────────────────────────────────
// PRODUTOS — públicos
// ─────────────────────────────────────────────

/**
 * Lista produtos com filtros e paginação.
 * @param {Object} params
 * @param {number}  [params.page=1]
 * @param {number}  [params.limit=9]
 * @param {string}  [params.busca]
 * @param {string}  [params.categoriaSlug]
 * @param {number}  [params.precoMin]
 * @param {number}  [params.precoMax]
 * @param {string}  [params.orderBy]   — 'preco' | 'nome' | 'createdAt'
 * @param {string}  [params.order]     — 'asc' | 'desc'
 * @returns {Promise<{ data: Produto[], meta: Meta }>}
 */
export async function getProdutos(params = {}) {
  const qs = new URLSearchParams()

  if (params.page)             qs.set('page',          params.page)
  if (params.limit)            qs.set('limit',         params.limit)
  if (params.busca)            qs.set('busca',         params.busca)
  if (params.categoriaSlug)    qs.set('categoriaSlug', params.categoriaSlug)
  if (params.precoMin != null) qs.set('precoMin',      params.precoMin)
  if (params.precoMax != null) qs.set('precoMax',      params.precoMax)
  if (params.orderBy)          qs.set('orderBy',       params.orderBy)
  if (params.order)            qs.set('order',         params.order)

  const query = qs.toString()
  return request(`/produtos${query ? `?${query}` : ''}`)
}

/**
 * Retorna produtos marcados como destaque.
 * @param {number} [limit=4]
 * @returns {Promise<{ data: Produto[] }>}
 */
export async function getProdutosDestaque(limit = 4) {
  return request(`/produtos/destaque?limit=${limit}`)
}

/**
 * Busca um produto pelo slug.
 * @param {string} slug
 * @returns {Promise<{ data: Produto }>}
 */
export async function getProdutoBySlug(slug) {
  return request(`/produtos/slug/${encodeURIComponent(slug)}`)
}

/**
 * Busca produtos relacionados ao produto informado.
 * @param {number} id
 * @param {number} [limit=4]
 * @returns {Promise<{ data: Produto[] }>}
 */
export async function getProdutosRelacionados(id, limit = 4) {
  return request(`/produtos/${id}/relacionados?limit=${limit}`)
}

// ─────────────────────────────────────────────
// CATEGORIAS — públicas
// ─────────────────────────────────────────────

/**
 * Lista todas as categorias ativas.
 * @returns {Promise<{ data: Categoria[] }>}
 */
export async function getCategorias() {
  return request('/categorias?ativo=true')
}
