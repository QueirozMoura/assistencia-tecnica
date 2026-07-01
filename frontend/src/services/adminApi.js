// ─────────────────────────────────────────────────────────────────────────────
// Camada de serviço — endpoints administrativos (requerem autenticação JWT)
//
// Todas as funções injetam o Bearer token automaticamente via api.js request().
// Para endpoints que precisam de multipart/form-data (upload), o token é
// injetado manualmente pois o Content-Type não pode ser application/json.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/** Função base reutilizável com token automático */
async function request(path, options = {}) {
  const token = localStorage.getItem('admin_token')

  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const responseBody = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(responseBody.message || `Erro ${res.status}`)
    err.status = res.status
    err.body = responseBody
    throw err
  }

  return responseBody
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

/**
 * Autentica o usuário e retorna { token, usuario }.
 * Não requer token — é a chamada que gera o token.
 * @param {string} email
 * @param {string} senha
 */
export async function login(email, senha) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, senha }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.message || 'Credenciais inválidas.')
    err.status = res.status
    throw err
  }

  return res.json() // { success, token, usuario }
}

/**
 * Retorna os dados do usuário autenticado.
 * @returns {Promise<{ data: Usuario }>}
 */
export async function getMe() {
  return request('/auth/me')
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

/**
 * Retorna totais e métricas do painel administrativo.
 * @returns {Promise<{ data: DashboardStats }>}
 */
export async function getDashboardStats() {
  return request('/dashboard/stats')
}

export async function getDashboard() {
  return getDashboardStats()
}

// ─────────────────────────────────────────────
// PRODUTOS — admin
// ─────────────────────────────────────────────

/**
 * Lista todos os produtos (incluindo inativos) com paginação e filtros.
 */
export async function adminGetProdutos(params = {}) {
  const qs = new URLSearchParams()
  if (params.page)          qs.set('page',    params.page)
  if (params.limit)         qs.set('limit',   params.limit)
  if (params.busca)         qs.set('busca',   params.busca)
  if (params.categoriaId)   qs.set('categoriaId', params.categoriaId)
  if (params.ativo != null) qs.set('ativo',   params.ativo)
  const query = qs.toString()
  return request(`/produtos${query ? `?${query}` : ''}`)
}

/**
 * Busca produto por ID.
 */
export async function adminGetProdutoById(id) {
  return request(`/produtos/${id}`)
}

/**
 * Cria um novo produto.
 * @param {Object} data — campos do produto
 */
export async function adminCreateProduto(data) {
  return request('/produtos', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * Atualiza um produto existente.
 * @param {number} id
 * @param {Object} data
 */
export async function adminUpdateProduto(id, data) {
  return request(`/produtos/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(data),
  })
}

/**
 * Exclui (ou desativa) um produto.
 * @param {number} id
 */
export async function adminDeleteProduto(id) {
  return request(`/produtos/${id}`, { method: 'DELETE' })
}

/**
 * Ativa ou desativa um produto via PATCH parcial.
 * @param {number}  id
 * @param {boolean} ativo
 */
export async function adminToggleProdutoAtivo(id, ativo) {
  return request(`/produtos/${id}`, {
    method: 'PUT',
    body:   JSON.stringify({ ativo }),
  })
}

/**
 * Faz upload de imagem de produto.
 * Retorna { data: { url, filename, ... } }
 * @param {File} file
 */
export async function adminUploadImagemProduto(file) {
  const token = localStorage.getItem('admin_token')
  const formData = new FormData()
  formData.append('imagem', file)

  const res = await fetch(`${BASE_URL}/upload/produto`, {
    method:  'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body:    formData,
    // Não definir Content-Type — o browser define automaticamente com boundary
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.message || 'Erro no upload.')
    err.status = res.status
    throw err
  }

  return res.json()
}

// ─────────────────────────────────────────────
// CATEGORIAS — admin
// ─────────────────────────────────────────────

/**
 * Lista todas as categorias (incluindo inativas).
 */
export async function adminGetCategorias(params = {}) {
  const qs = new URLSearchParams()
  if (params.ativo != null) qs.set('ativo', params.ativo)
  const query = qs.toString()
  return request(`/categorias${query ? `?${query}` : ''}`)
}

/**
 * Cria uma nova categoria.
 */
export async function adminCreateCategoria(data) {
  return request('/categorias', {
    method: 'POST',
    body:   JSON.stringify(data),
  })
}

/**
 * Atualiza uma categoria.
 */
export async function adminUpdateCategoria(id, data) {
  return request(`/categorias/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(data),
  })
}

/**
 * Exclui uma categoria.
 */
export async function adminDeleteCategoria(id) {
  return request(`/categorias/${id}`, { method: 'DELETE' })
}

// ─────────────────────────────────────────────
// PEDIDOS — admin
// ─────────────────────────────────────────────

/**
 * Lista pedidos com paginação e filtro de status.
 */
export async function adminGetPedidos(params = {}) {
  const qs = new URLSearchParams()
  if (params.page)      qs.set('page',      params.page)
  if (params.limit)     qs.set('limit',     params.limit)
  if (params.status)    qs.set('status',    params.status)
  if (params.clienteId) qs.set('clienteId', params.clienteId)
  const query = qs.toString()
  return request(`/pedidos${query ? `?${query}` : ''}`)
}

/**
 * Atualiza o status de um pedido.
 * @param {number} id
 * @param {string} status — 'PENDENTE' | 'PAGO' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO'
 */
export async function adminUpdateStatusPedido(id, status) {
  return request(`/pedidos/${id}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status }),
  })
}

// ─────────────────────────────────────────────
// CLIENTES — admin
// ─────────────────────────────────────────────

/**
 * Lista clientes com paginação e busca.
 */
export async function adminGetClientes(params = {}) {
  const qs = new URLSearchParams()
  if (params.page)  qs.set('page',  params.page)
  if (params.limit) qs.set('limit', params.limit)
  if (params.busca) qs.set('busca', params.busca)
  const query = qs.toString()
  return request(`/clientes${query ? `?${query}` : ''}`)
}

export async function getClientes(params = {}) {
  return adminGetClientes(params)
}

/**
 * Busca cliente por ID com histórico de pedidos e agendamentos.
 */
export async function adminGetClienteById(id) {
  return request(`/clientes/${id}`)
}

// ─────────────────────────────────────────────
// AGENDAMENTOS — admin
// ─────────────────────────────────────────────

export async function adminGetAgendamentos(params = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', params.page)
  if (params.limit) qs.set('limit', params.limit)
  if (params.status) qs.set('status', params.status)
  if (params.busca) qs.set('busca', params.busca)
  const query = qs.toString()
  return request(`/agendamentos${query ? `?${query}` : ''}`)
}

export async function adminUpdateStatusAgendamento(id, status) {
  return request(`/agendamentos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
