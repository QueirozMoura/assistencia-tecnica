import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { clientResetPwd } from '../services/clientApi'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token          = searchParams.get('token')

  const [senha,        setSenha]        = useState('')
  const [confirmar,    setConfirmar]    = useState('')
  const [showSenha,    setShowSenha]    = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(false)

  useEffect(() => {
    if (!token) setError('Link inválido. Solicite um novo link de recuperação.')
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (senha.length < 6) { setError('Senha deve ter no mínimo 6 caracteres.'); return }
    if (senha !== confirmar) { setError('As senhas não coincidem.'); return }

    setSubmitting(true)
    setError(null)
    try {
      await clientResetPwd({ token, senha, confirmarSenha: confirmar })
      setSuccess(true)
      setTimeout(() => navigate('/login', { state: { toast: 'Senha redefinida com sucesso!' } }), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-[#003366] font-bold text-xl hover:text-[#0070ea] transition-colors">
            <div className="w-10 h-10 bg-[#0070ea] rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14v11H3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 5l2-2h10l2 2" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            EletroCenter
          </Link>
          <h1 className="text-2xl font-bold text-[#181c20] mt-4 mb-1">Redefinir senha</h1>
          <p className="text-sm text-[#737780]">Crie uma nova senha para sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e8ee] p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#d4f5e2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M4 14l6 6 14-14" stroke="#1a6b3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-[#181c20] mb-2">Senha redefinida!</h3>
              <p className="text-sm text-[#737780]">Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-start gap-2.5 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                  {!token && (
                    <Link to="/esqueci-senha" className="ml-auto underline font-medium whitespace-nowrap">Solicitar novo link</Link>
                  )}
                </div>
              )}
              {token && (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Nova senha</label>
                    <div className="relative">
                      <input type={showSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres" autoComplete="new-password" disabled={submitting}
                        className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
                      />
                      <button type="button" onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c3c6d1] hover:text-[#43474f]">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                          {!showSenha && <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Confirmar nova senha</label>
                    <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
                      placeholder="Repita a nova senha" autoComplete="new-password" disabled={submitting}
                      className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
                    />
                  </div>
                  <button type="submit" disabled={submitting || !senha || !confirmar}
                    className="w-full bg-[#0070ea] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0059bb] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {submitting ? 'Salvando...' : 'Redefinir senha'}
                  </button>
                </form>
              )}
              <p className="text-center text-sm text-[#737780] mt-6">
                <Link to="/login" className="text-[#0070ea] font-semibold hover:underline">← Voltar ao login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
