import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import StatsCard from '../../components/admin/StatsCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { getDashboard } from '../../services/adminApi'
import { formatPrice } from '../../utils/formatPrice'

function DashboardStatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#eef1f6] bg-white px-3 py-2">
      <span className="text-xs font-medium text-[#5b6472]">{label}</span>
      <span className="text-sm font-bold text-[#111827]">{value}</span>
    </div>
  )
}

function DashboardSectionSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
      <SkeletonLoader lines={6} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchStats(source = 'manual') {
    const startedAt = Date.now()
    console.debug('[Dashboard] fetchStats:start', { source, startedAt })
    try {
      setLoading(true)
      setError('')
      const response = await getDashboard()
      console.debug('[Dashboard] fetchStats:success', {
        source,
        elapsedMs: Date.now() - startedAt,
        response,
      })
      setStats(response?.data || null)
    } catch (err) {
      console.debug('[Dashboard] fetchStats:error', {
        source,
        elapsedMs: Date.now() - startedAt,
        err,
      })
      setError(err?.message || 'Erro ao carregar dados do dashboard.')
      setStats(null)
    } finally {
      setLoading(false)
      console.debug('[Dashboard] fetchStats:finally', {
        source,
        elapsedMs: Date.now() - startedAt,
      })
    }
  }


  useEffect(() => {
    console.debug('[Dashboard] state:loading', loading)
  }, [loading])

  useEffect(() => {
    console.debug('[Dashboard] state:error', error)
  }, [error])

  useEffect(() => {
    console.debug('[Dashboard] state:stats', stats)
  }, [stats])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const hasData = Boolean(stats)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            {greeting}, {user?.nome?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm text-[#5b6472]">Visão geral do negócio em tempo real.</p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#0b66d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0857b1] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </div>

      {error && (
        <ErrorState
          title="Falha ao carregar dashboard"
          message={error}
          onRetry={fetchStats}
        />
      )}

      {!loading && !error && !hasData && (
        <EmptyState
          title="Sem dados para exibir"
          message="Nenhuma métrica disponível no momento."
        />
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Receita total"
          value={loading ? '—' : formatPrice(Number(stats?.pedidos?.receitaTotal || 0))}
          subtitle="Receita acumulada em pedidos"
          color="green"
          loading={loading}
          to="/admin/pedidos"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v18M17 7H9.5a3.5 3.5 0 100 7H14.5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />

        <StatsCard
          title="Total de pedidos"
          value={loading ? '—' : stats?.pedidos?.total ?? 0}
          subtitle="Pedidos processados"
          color="blue"
          loading={loading}
          to="/admin/pedidos"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 4h2l2.2 10.2a2 2 0 002 1.6h8.8a2 2 0 001.9-1.4L22 7H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />

        <StatsCard
          title="Total de clientes"
          value={loading ? '—' : stats?.clientes?.total ?? 0}
          subtitle="Base de clientes cadastrados"
          color="purple"
          loading={loading}
          to="/admin/clientes"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />

        <StatsCard
          title="Total de produtos"
          value={loading ? '—' : stats?.produtos?.total ?? 0}
          subtitle={`${loading ? '—' : stats?.produtos?.ativos ?? 0} ativos no catálogo`}
          color="amber"
          loading={loading}
          to="/admin/produtos"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M4 12h16M4 17h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          <>
            <DashboardSectionSkeleton />
            <DashboardSectionSkeleton />
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#111827]">Status dos pedidos</h2>
                <Link to="/admin/pedidos" className="text-xs font-semibold text-[#0b66d0] hover:underline">
                  Ver pedidos
                </Link>
              </div>
              <div className="space-y-2">
                <DashboardStatusRow label="Pendente" value={stats?.pedidos?.porStatus?.PENDENTE ?? 0} />
                <DashboardStatusRow label="Pago" value={stats?.pedidos?.porStatus?.PAGO ?? 0} />
                <DashboardStatusRow label="Enviado" value={stats?.pedidos?.porStatus?.ENVIADO ?? 0} />
                <DashboardStatusRow label="Entregue" value={stats?.pedidos?.porStatus?.ENTREGUE ?? 0} />
                <DashboardStatusRow label="Cancelado" value={stats?.pedidos?.porStatus?.CANCELADO ?? 0} />
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e8ee] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#111827]">Status dos agendamentos</h2>
                <span className="text-xs font-medium text-[#5b6472]">
                  Total: {stats?.agendamentos?.total ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                <DashboardStatusRow label="Pendente" value={stats?.agendamentos?.porStatus?.PENDENTE ?? 0} />
                <DashboardStatusRow label="Confirmado" value={stats?.agendamentos?.porStatus?.CONFIRMADO ?? 0} />
                <DashboardStatusRow label="Em andamento" value={stats?.agendamentos?.porStatus?.EM_ANDAMENTO ?? 0} />
                <DashboardStatusRow label="Concluído" value={stats?.agendamentos?.porStatus?.CONCLUIDO ?? 0} />
                <DashboardStatusRow label="Cancelado" value={stats?.agendamentos?.porStatus?.CANCELADO ?? 0} />
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
