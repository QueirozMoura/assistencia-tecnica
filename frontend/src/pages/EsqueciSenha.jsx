import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clientForgotPwd } from '../services/clientApi'

export default function EsqueciSenha() {
  const [email,      setEmail]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent,       setSent]       = useState(false)
  const [error,      setError]      = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError(null)
    try {
      await clientForgotPwd(email)
      setSent(true)
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
          <h1 className="text-2xl font-bold text-[#181c20] mt-4 mb-1">Esqueci minha senha</h1>
          <p className="text-sm text-[#737780]">Informe seu e-mail e enviaremos as instruções de recuperação</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e8ee] p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#d4f5e2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M4 14l6 6 14-14" stroke="#1a6b3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-[#181c20] mb-2">E-mail enviado!</h3>
              <p className="text-sm text-[#737780] mb-6">
                Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá as instruções em breve. Verifique também a caixa de spam.
              </p>
              <Link to="/login" className="text-[#0070ea] text-sm font-semibold hover:underline">← Voltar ao login</Link>
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
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#181c20] mb-1.5">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="seu@email.com" autoComplete="email" disabled={submitting}
                    className="w-full border border-[#e5e8ee] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20 transition-all disabled:opacity-60"
                  />
                </div>
                <button type="submit" disabled={submitting || !email}
                  className="w-full bg-[#0070ea] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0059bb] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {submitting ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>
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
