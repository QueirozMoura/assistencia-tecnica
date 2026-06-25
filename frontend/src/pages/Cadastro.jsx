import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClientAuth } from '../hooks/useClientAuth'
import { clientRegister } from '../services/clientApi'

export default function Cadastro() {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading } = useClientAuth()

  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '', confirmarSenha: '' })
  const [showSenha,    setShowSenha]    = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [errors,       setErrors]       = useState({})
  const [apiError,     setApiError]     = useState(null)
  const [success,      setSuccess]      = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/minha-conta', { replace: true })
  }, [loading, isAuthenticated, navigate])

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: null }))
    }
  }

  function formatTelefone(v) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2)  return `(${d}`
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
    if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    return v
  }

  function validate() {
    const errs = {}
    if (!form.nome.trim() || form.nome.trim().length < 2) errs.nome = 'Nome deve ter no mínimo 2 caracteres.'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'E-mail inválido.'
    if (!form.telefone || form.telefone.replace(/\D/g,'').length < 10) errs.telefone = 'Telefone inválido.'
    if (!form.senha || form.senha.length < 6) errs.senha = 'Senha deve ter no mínimo 6 caracteres.'
    if (form.senha !== form.confirmarSenha) errs.confirmarSenha = 'As senhas não coincidem.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setApiError(null)
    try {
      const res = await clientRegister({
        nome:           form.nome.trim(),
        email:          form.email.toLowerCase().trim(),
        telefone:       form.telefone.replace(/\D/g,''),
        senha:          form.senha,
        confirmarSenha: form.confirmarSenha,
      })
      login(res.token, res.cliente)
      setSuccess(true)
      setTimeout(() => navigate('/minha-conta', { replace: true }), 2000)
    } catch (err) {
      setApiError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#e5e8ee] p-10 text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-[#d4f5e2] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14l5 5 11-11" stroke="#1a6b3c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#003366] mb-2">Conta criada!</h2>
        <p className="text-sm text-[#737780]">Verifique seu e-mail para ativar sua conta. Redirecionando...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">

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
          <h1 className="text-2xl font-bold text-[#181c20] mt-4 mb-1">Criar conta</h1>
          <p className="text-sm text-[#737780]">Cadastre-se para acompanhar seus pedidos e agendamentos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e8ee] p-8">

          {apiError && (
            <div className="mb-5 flex items-start gap-2.5 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Nome completo</label>
              <input type="text" value={form.nome} onChange={set('nome')} placeholder="João Silva"
                autoComplete="name" disabled={submitting}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-60
                  ${errors.nome ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.nome && <p className="text-xs text-[#ba1a1a] mt-1">{errors.nome}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com"
                autoComplete="email" disabled={submitting}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-60
                  ${errors.email ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.email && <p className="text-xs text-[#ba1a1a] mt-1">{errors.email}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Telefone</label>
              <input type="tel" value={form.telefone}
                onChange={(e) => { setForm((f) => ({ ...f, telefone: formatTelefone(e.target.value) })); setErrors((er) => ({ ...er, telefone: null })) }}
                placeholder="(11) 99999-9999" autoComplete="tel" disabled={submitting}
                className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-60
                  ${errors.telefone ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
              />
              {errors.telefone && <p className="text-xs text-[#ba1a1a] mt-1">{errors.telefone}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Senha</label>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} value={form.senha} onChange={set('senha')}
                  placeholder="Mínimo 6 caracteres" autoComplete="new-password" disabled={submitting}
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all disabled:opacity-60
                    ${errors.senha ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
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
              {errors.senha && <p className="text-xs text-[#ba1a1a] mt-1">{errors.senha}</p>}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block text-sm font-semibold text-[#181c20] mb-1.5">Confirmar senha</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={form.confirmarSenha} onChange={set('confirmarSenha')}
                  placeholder="Repita a senha" autoComplete="new-password" disabled={submitting}
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all disabled:opacity-60
                    ${errors.confirmarSenha ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20' : 'border-[#e5e8ee] focus:border-[#0070ea] focus:ring-2 focus:ring-[#0070ea]/20'}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c3c6d1] hover:text-[#43474f]">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                    {!showConfirm && <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
                  </svg>
                </button>
              </div>
              {errors.confirmarSenha && <p className="text-xs text-[#ba1a1a] mt-1">{errors.confirmarSenha}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#0070ea] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0059bb] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-[#737780] mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-[#0070ea] font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
