import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientListMeusAgendamentos } from '../services/clientApi'

const statusStyles = {
  PENDENTE: 'bg-[#fff4cc] text-[#8a6d00]',
  CONFIRMADO: 'bg-[#d6ecff] text-[#004a99]',
  EM_ANDAMENTO: 'bg-[#e8ddff] text-[#5a2ca0]',
  CONCLUIDO: 'bg-[#d4f5e2] text-[#1a6b3c]',
  CANCELADO: 'bg-[#ffd9d9] text-[#8f1d1d]',
}

const statusLabel = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
}

export default function MeusAgendamentos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const res = await clientListMeusAgendamentos()
        if (!mounted) return
        setItems(Array.isArray(res?.data) ? res.data : [])
      } catch (err) {
        if (!mounted) return
        setError(err?.message || 'Não foi possível carregar seus agendamentos.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a?.dataAgendamento ? new Date(a.dataAgendamento).getTime() : 0
      const db = b?.dataAgendamento ? new Date(b.dataAgendamento).getTime() : 0
      return db - da
    })
  }, [items])

  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/minha-conta" className="p-2 rounded-xl hover:bg-[#e5e8ee] transition-colors text-[#43474f]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Meus Agendamentos</h1>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-8 text-center text-[#737780]">
            Carregando agendamentos...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl border border-[#ffd9d9] p-8 text-center">
            <p className="text-sm text-[#8f1d1d] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-[#003366] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#00264f] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e8ee] p-12 text-center">
            <div className="w-16 h-16 bg-[#d4f5e2] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="4" width="22" height="20" rx="3" stroke="#1a6b3c" strokeWidth="2"/>
                <path d="M9 2v4M19 2v4M3 11h22" stroke="#1a6b3c" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#003366] mb-2">Nenhum agendamento ainda</h2>
            <p className="text-sm text-[#737780] mb-6">Seus agendamentos de assistência técnica aparecerão aqui.</p>
            <Link to="/agendamento" className="inline-flex items-center gap-2 bg-[#1a6b3c] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#145530] transition-colors">
              Agendar assistência
            </Link>
          </div>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="space-y-4">
            {sorted.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <p className="text-sm text-[#737780]">Protocolo #{a.id}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[a.status] || 'bg-[#e5e8ee] text-[#43474f]'}`}>
                    {statusLabel[a.status] || a.status}
                  </span>
                </div>
                <h3 className="font-bold text-[#003366]">{a.equipamento}{a.marca ? ` • ${a.marca}` : ''}{a.modelo ? ` • ${a.modelo}` : ''}</h3>
                <p className="text-sm text-[#43474f] mt-1">{a.problema}</p>
                <div className="mt-3 text-xs text-[#737780] flex flex-wrap gap-4">
                  <span>Criado em: {new Date(a.createdAt).toLocaleString('pt-BR')}</span>
                  {a.dataAgendamento && <span>Data sugerida: {new Date(a.dataAgendamento).toLocaleString('pt-BR')}</span>}
                  {a.melhorHorario && <span>Melhor horário: {a.melhorHorario}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
