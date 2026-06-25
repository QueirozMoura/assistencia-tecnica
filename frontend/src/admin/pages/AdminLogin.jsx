import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { login as apiLogin } from '../../services/adminApi'

export default function AdminLogin() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, isAuthenticated, isAdmin, loading } = useAuth()

  const [email,     setEmail]     = useState('')
  const [senha,     setSenha]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState(
    // Mensagem vinda do PrivateRoute (ex: role insuficiente)
    location.state?.error ?? null
  )

  // Se já autenticado como admin, redirecionar direto
  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      const destino = location.state?.from?.pathname ?? '/admin/dashboard'
      navigate(destino, { replace: true })
    }
  }, [loading, isAuthenticated, isAdmin, navigate, location])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await apiLogin(email, senha)
      // res = { success, token, usuario }

      if (res.usuario.role !== 'ADMIN') {
        setError('Acesso restrito a administradores.')
        return
      }

      login(res.token, res.usuario)
      const destino = location.state?.from?.pathname ?? '/admin/dashboard'
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Enquanto verifica token inicial, não renderiza o form
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff]">
        <div className="w-10 h-10 border-4 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001e40] via-[#003366] to-[#0059bb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 border border-white/20">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 8h20v16H6z" stroke="#a7c8ff" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M6 12h20" stroke="#a7c8ff" strokeWidth="2"/>
              <path d="M10 16h4M10 20h8" stroke="#a7c8ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-[#8fa8c8] text-sm mt-1">EletroCenter — Área restrita</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Erro */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 5v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* E-mail */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-[#181c20] mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                placeholder="admin@assistencia.com"
                className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm text-[#181c20] placeholder-[#c3c6d1] outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
              />
            </div>

            {/* Senha */}
            <div className="mb-6">
              <label htmlFor="senha" className="block text-sm font-semibold text-[#181c20] mb-1.5">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                disabled={submitting}
                placeholder="••••••••"
                className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm text-[#181c20] placeholder-[#c3c6d1] outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={submitting || !email || !senha}
              className="w-full bg-[#0070ea] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0059bb] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>

          {/* Link voltar ao site */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-xs text-[#737780] hover:text-[#0070ea] transition-colors"
            >
              ← Voltar ao site
            </a>
          </div>
        </div>

        <p className="text-center text-[#8fa8c8] text-xs mt-6">
          Acesso restrito a administradores autorizados.
        </p>
      </div>
    </div>
  )
}
