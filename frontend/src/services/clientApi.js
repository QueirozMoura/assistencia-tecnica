const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('client_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err  = new Error(body.message || `Erro ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const clientRegister    = (data)          => request('/client-auth/register',       { method: 'POST', body: JSON.stringify(data) })
export const clientLogin       = (email, senha)  => request('/client-auth/login',          { method: 'POST', body: JSON.stringify({ email, senha }) })
export const clientGoogleAuth  = ({ idToken, code } = {}) =>
  request('/client-auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, code }),
  })
export const clientForgotPwd   = (email)         => request('/client-auth/forgot-password',{ method: 'POST', body: JSON.stringify({ email }) })
export const clientResetPwd    = (data)          => request('/client-auth/reset-password', { method: 'POST', body: JSON.stringify(data) })
export const clientVerifyEmail = (token)         => request(`/client-auth/verify-email?token=${token}`)
export const clientGetMe       = ()              => request('/client-auth/me')
