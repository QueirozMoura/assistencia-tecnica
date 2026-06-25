import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useClientAuth } from '../hooks/useClientAuth'
import { clientLogin, clientGoogleAuth } from '../services/clientApi'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login, isAuthenticated, loading } = useClientAuth()

  const [email,      setEmail]      = useState('')
  const [senha,      setSenha]      = useState('')
  const [showSenha,  setShowSenha]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(location.state?.error ?? null)

  const destino = location.state?.from?.pathname ?? '/minha-conta'

  useEffect(() => {
    if (!loading && isAuthenticated) navigate(destino, { replace: true })
  }, [loading, isAuthenticated, navigate, destino])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await clientLogin(email, senha)
      login(res.token, res.cliente)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleCredential(credentialResponse) {
    try {
      setError(null)
      setSubmitting(true)

      if (!credentialResponse?.credential) {
        throw new Error('Falha ao autenticar com Google.')
      }

      const res = await clientGoogleAuth({ idToken: credentialResponse.credential })
      login(res.token, res.cliente)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message || 'Erro ao autenticar com Google.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-[#003366] font-bold text-xl hover:text-[#0070ea] transition-colors">
            <div className="w-10 h-10 bg-[#0070ea] rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14v11H3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 5l2-2h10l2 2" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M7 10h6M7 13h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            EletroCenter
          </Link>
          <h1 className="text-2xl font-bold text-[#181c20] mt-4 mb-1">Bem-vindo de volta</h1>
          <p className="text-sm text-[#737780]">Entre na sua conta para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e8ee] p-8">

          {/* Erro */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Google */}
          <div className="mb-5 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() => setError('Falha no login com Google.')}
              text="continue_with"
              shape="pill"
              locale="pt-BR"
            />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#e5e8ee]" />
            <span className="text-xs text-[#c3c6d1] font-medium">ou</span>
            <div className="flex-1 h-px bg-[#e5e8ee]" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">E-mail</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="seu@email.com"
                disabled={submitting}
                className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#181c20]">Senha</label>
                <Link to="/esqueci-senha" className="text-xs text-[#0070ea] hover:underline">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  disabled={submitting}
                  className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
                />
                <button type="button" onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c3c6d1] hover:text-[#43474f] transition-colors">
                  {showSenha
                    ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting || !email || !senha}
              className="w-full bg-[#0070ea] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0059bb] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-[#737780] mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-[#0070ea] font-semibold hover:underline">Cadastre-se grátis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
