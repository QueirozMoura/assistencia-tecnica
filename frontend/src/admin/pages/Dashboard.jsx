import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardStats } from '../../services/adminApi'
import { formatPrice } from '../../utils/formatPrice'

// ── Componente de card de métrica ─────────────────────────────────────────────
function StatCard({ title, value, sub, icon, color, loading, to }) {
  const colors = {
    blue:   { bg: 'bg-[#cce0ff]', text: 'text-[#003366]', icon: 'text-[#0070ea]', border: 'border-[#cce0ff]' },
    green:  { bg: 'bg-[#d4f5e2]', text: 'text-[#1a6b3c]', icon: 'text-[#1a6b3c]', border: 'border-[#d4f5e2]' },
    amber:  { bg: 'bg-[#fff3cd]', text: 'text-[#7a5c00]', icon: 'text-[#d4a017]', border: 'border-[#fff3cd]' },
    red:    { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', icon: 'text-[#ba1a1a]', border: 'border-[#ffdad6]' },
    purple: { bg: 'bg-[#ede7f6]', text: 'text-[#4a148c]', icon: 'text-[#7b1fa2]', border: 'border-[#ede7f6]' },
    teal:   { bg: 'bg-[#e0f7fa]', text: 'text-[#006064]', icon: 'text-[#00838f]', border: 'border-[#e0f7fa]' },
  }
  const c = colors[color] ?? colors.blue

  const inner = (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 hover:shadow-md transition-shadow h-full`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
        {to && (
          <span className="text-xs text-[#0070ea] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver →
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-7 bg-[#e5e8ee] rounded w-1/2" />
          <div className="h-3 bg-[#e5e8ee] rounded w-3/4" />
        </div>
      ) : (
        <>
          <p className={`text-2xl font-bold ${c.text} leading-tight`}>{value}</p>
          <p className="text-xs text-[#737780] mt-1 leading-snug">{sub ?? title}</p>
        </>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="group block">
        {inner}
      </Link>
    )
  }
  return inner
}

// ── Badge de status de pedido ─────────────────────────────────────────────────
function StatusBadge({ label, count, color }) {
  const colors = {
    gray:   'bg-[#e5e8ee] text-[#43474f]',
    green:  'bg-[#d4f5e2] text-[#1a6b3c]',
    blue:   'bg-[#cce0ff] text-[#003366]',
    teal:   'bg-[#e0f7fa] text-[#006064]',
    red:    'bg-[#ffdad6] text-[#ba1a1a]',
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#f1f4f9] last:border-0">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors[color]}`}>{label}</span>
      <span className="text-sm font-bold text-[#181c20]">{count}</span>
    </div>
  )
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()

  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchStats = useCallback(() => {
    setLoading(true)
    setError(null)
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#181c20]">
            {saudacao}, {user?.nome?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-[#737780] mt-0.5">
            Aqui está um resumo do seu sistema hoje.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-[#0070ea] hover:text-[#003366] transition-colors disabled:opacity-50"
          title="Atualizar dados"
        >
          <svg
            width="15" height="15" viewBox="0 0 15 15" fill="none"
            className={loading ? 'animate-spin' : ''}
          >
            <path d="M13 7.5A5.5 5.5 0 112.5 4M2 1v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Atualizar
        </button>
      </div>

      {/* ── Erro ───────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-xl px-4 py-3 text-sm">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 5v4M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>Erro ao carregar estatísticas: {error}</span>
          <button onClick={fetchStats} className="ml-auto underline font-medium">Tentar novamente</button>
        </div>
      )}

      {/* ── Cards principais ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="Total de Produtos"
          value={stats?.produtos.total ?? '—'}
          sub={`${stats?.produtos.ativos ?? 0} ativos no catálogo`}
          color="blue"
          loading={loading}
          to="/admin/produtos"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <StatCard
          title="Categorias"
          value={stats?.categorias.total ?? '—'}
          sub="Categorias ativas"
          color="purple"
          loading={loading}
          to="/admin/categorias"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5a2 2 0 012-2h3l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatCard
          title="Total de Pedidos"
          value={stats?.pedidos.total ?? '—'}
          sub={`Receita: ${stats ? formatPrice(stats.pedidos.receitaTotal) : '—'}`}
          color="green"
          loading={loading}
          to="/admin/pedidos"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 2h3l2.4 9.6a1 1 0 001 .4H16a1 1 0 001-.76L18 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="17" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="17" r="1.5" fill="currentColor"/>
            </svg>
          }
        />
        <StatCard
          title="Total de Clientes"
          value={stats?.clientes.total ?? '—'}
          sub="Clientes cadastrados"
          color="teal"
          loading={loading}
          to="/admin/clientes"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 18c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <StatCard
          title="Produtos em Destaque"
          value={stats?.produtos.destaque ?? '—'}
          sub="Exibidos na Home"
          color="amber"
          loading={loading}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27l-4.33 2.23.83-4.82L3 7.27l4.91-.71L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatCard
          title="Sem Estoque"
          value={stats?.produtos.semEstoque ?? '—'}
          sub="Produtos ativos sem estoque"
          color="red"
          loading={loading}
          to="/admin/produtos"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>

      {/* ── Linha inferior: Pedidos por status + Agendamentos ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pedidos por status */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#181c20] text-sm">Pedidos por Status</h3>
            <Link to="/admin/pedidos" className="text-xs text-[#0070ea] hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-[#e5e8ee] rounded" />)}
            </div>
          ) : (
            <div>
              <StatusBadge label="Pendente"  count={stats?.pedidos.porStatus.PENDENTE  ?? 0} color="gray"  />
              <StatusBadge label="Pago"      count={stats?.pedidos.porStatus.PAGO      ?? 0} color="green" />
              <StatusBadge label="Enviado"   count={stats?.pedidos.porStatus.ENVIADO   ?? 0} color="blue"  />
              <StatusBadge label="Entregue"  count={stats?.pedidos.porStatus.ENTREGUE  ?? 0} color="teal"  />
              <StatusBadge label="Cancelado" count={stats?.pedidos.porStatus.CANCELADO ?? 0} color="red"   />
            </div>
          )}
        </div>

        {/* Agendamentos por status */}
        <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#181c20] text-sm">Agendamentos por Status</h3>
            <span className="text-xs text-[#737780]">
              Total: {loading ? '—' : (stats?.agendamentos.total ?? 0)}
            </span>
          </div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-[#e5e8ee] rounded" />)}
            </div>
          ) : (
            <div>
              <StatusBadge label="Pendente"     count={stats?.agendamentos.porStatus.PENDENTE     ?? 0} color="gray"  />
              <StatusBadge label="Confirmado"   count={stats?.agendamentos.porStatus.CONFIRMADO   ?? 0} color="blue"  />
              <StatusBadge label="Em Andamento" count={stats?.agendamentos.porStatus.EM_ANDAMENTO ?? 0} color="amber" />
              <StatusBadge label="Concluído"    count={stats?.agendamentos.porStatus.CONCLUIDO    ?? 0} color="green" />
              <StatusBadge label="Cancelado"    count={stats?.agendamentos.porStatus.CANCELADO    ?? 0} color="red"   />
            </div>
          )}
        </div>
      </div>

      {/* ── Atalhos rápidos ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e8ee] p-5">
        <h3 className="font-semibold text-[#181c20] text-sm mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Novo Produto',    to: '/admin/produtos/novo',    color: 'bg-[#cce0ff] text-[#003366]' },
            { label: 'Nova Categoria',  to: '/admin/categorias/nova',  color: 'bg-[#ede7f6] text-[#4a148c]' },
            { label: 'Ver Pedidos',     to: '/admin/pedidos',          color: 'bg-[#d4f5e2] text-[#1a6b3c]' },
            { label: 'Ver Clientes',    to: '/admin/clientes',         color: 'bg-[#e0f7fa] text-[#006064]' },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className={`${a.color} rounded-xl px-4 py-3 text-xs font-semibold text-center hover:opacity-80 transition-opacity`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
