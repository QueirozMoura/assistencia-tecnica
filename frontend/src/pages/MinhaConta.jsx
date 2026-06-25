import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClientAuth } from '../hooks/useClientAuth'
import { clientGetMe } from '../services/clientApi'

export default function MinhaConta() {
  const { cliente, logout } = useClientAuth()
  const navigate = useNavigate()

  const [dados,   setDados]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientGetMe()
      .then((res) => setDados(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const info = dados ?? cliente

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-3xl mx-auto px-4">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#003366]">Minha Conta</h1>
            <p className="text-sm text-[#737780] mt-0.5">Gerencie seus dados e acompanhe seus pedidos</p>
          </div>
          <Link to="/" className="text-sm text-[#0070ea] hover:underline font-medium">← Voltar à loja</Link>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white rounded-2xl border border-[#e5e8ee]" />
            <div className="h-48 bg-white rounded-2xl border border-[#e5e8ee]" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* Card do perfil */}
            <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#0070ea] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                  {info?.nome?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-[#181c20] truncate">{info?.nome}</h2>
                  <p className="text-sm text-[#737780] truncate">{info?.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {info?.emailVerificado ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a6b3c] bg-[#d4f5e2] px-2.5 py-1 rounded-full">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        E-mail verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#d4a017] bg-[#fff3cd] px-2.5 py-1 rounded-full">
                        ⚠ E-mail não verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dados pessoais */}
            <div className="bg-white rounded-2xl border border-[#e5e8ee] p-6">
              <h3 className="font-semibold text-[#181c20] mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Nome completo', value: info?.nome },
                  { label: 'E-mail',        value: info?.email },
                  { label: 'Telefone',      value: info?.telefone },
                  { label: 'CPF',           value: info?.cpf ?? 'Não informado' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#f7f9ff] rounded-xl p-3 border border-[#e5e8ee]">
                    <p className="text-xs text-[#737780] font-medium mb-0.5">{label}</p>
                    <p className="font-semibold text-[#181c20]">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Atalhos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/meus-pedidos"
                className="bg-white rounded-2xl border border-[#e5e8ee] p-5 hover:border-[#0070ea] hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#cce0ff] rounded-xl flex items-center justify-center group-hover:bg-[#0070ea] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 2h2l2 8h8l2-6H6" stroke="#003366" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors"/>
                      <circle cx="7" cy="14" r="1.2" fill="#003366" className="group-hover:fill-white transition-colors"/>
                      <circle cx="13" cy="14" r="1.2" fill="#003366" className="group-hover:fill-white transition-colors"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[#181c20] text-sm">Meus Pedidos</p>
                    <p className="text-xs text-[#737780]">
                      {dados?._count?.pedidos ?? 0} pedido{(dados?._count?.pedidos ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Link>

              <Link to="/meus-agendamentos"
                className="bg-white rounded-2xl border border-[#e5e8ee] p-5 hover:border-[#0070ea] hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#d4f5e2] rounded-xl flex items-center justify-center group-hover:bg-[#1a6b3c] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="2" y="3" width="14" height="13" rx="2" stroke="#1a6b3c" strokeWidth="1.3" className="group-hover:stroke-white transition-colors"/>
                      <path d="M6 1v4M12 1v4M2 8h14" stroke="#1a6b3c" strokeWidth="1.3" strokeLinecap="round" className="group-hover:stroke-white transition-colors"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[#181c20] text-sm">Meus Agendamentos</p>
                    <p className="text-xs text-[#737780]">
                      {dados?._count?.agendamentos ?? 0} agendamento{(dados?._count?.agendamentos ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Logout */}
            <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
              <button onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-[#ba1a1a] hover:text-[#93000a] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sair da conta
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
