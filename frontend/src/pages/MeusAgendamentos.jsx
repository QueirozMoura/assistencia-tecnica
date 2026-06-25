import { Link } from 'react-router-dom'

export default function MeusAgendamentos() {
  return (
    <div className="bg-[#f7f9ff] min-h-screen py-10">
      <div className="container-max max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/minha-conta" className="p-2 rounded-xl hover:bg-[#e5e8ee] transition-colors text-[#43474f]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-[#003366]">Meus Agendamentos</h1>
        </div>
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
      </div>
    </div>
  )
}
