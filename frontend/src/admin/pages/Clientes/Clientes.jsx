import { useEffect, useMemo, useState } from 'react'
import SkeletonLoader from '../../../components/ui/SkeletonLoader'
import ErrorState from '../../../components/ui/ErrorState'
import EmptyState from '../../../components/ui/EmptyState'
import { getClientes } from '../../../services/adminApi'

function formatDateBR(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchClientes = async (source = 'manual') => {
    const startedAt = Date.now()
    console.debug('[Clientes] fetchClientes:start', { source, startedAt })
    try {
      setLoading(true)
      setError('')
      const response = await getClientes()
      console.debug('[Clientes] fetchClientes:success', {
        source,
        elapsedMs: Date.now() - startedAt,
        response,
      })
      setClientes(response?.data || [])
    } catch (err) {
      console.debug('[Clientes] fetchClientes:error', {
        source,
        elapsedMs: Date.now() - startedAt,
        err,
      })
      setError(err?.message || 'Erro ao carregar clientes.')
      setClientes([])
    } finally {
      setLoading(false)
      console.debug('[Clientes] fetchClientes:finally', {
        source,
        elapsedMs: Date.now() - startedAt,
      })
    }
  }

  useEffect(() => {
    console.debug('[Clientes] state:loading', loading)
  }, [loading])

  useEffect(() => {
    console.debug('[Clientes] state:error', error)
  }, [error])

  useEffect(() => {
    console.debug('[Clientes] state:clientes', clientes)
  }, [clientes])

  const filteredClientes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return clientes
    return clientes.filter((cliente) =>
      String(cliente?.nome || '')
        .toLowerCase()
        .includes(query)
    )
  }, [clientes, search])

  const hasData = filteredClientes.length > 0

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Clientes</h1>
          <p className="text-sm text-[#5b6472]">Gestão de clientes com experiência SaaS.</p>
        </div>

        <button
          onClick={fetchClientes}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-[#0b66d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0857b1] disabled:opacity-60"
        >
          {loading ? 'Atualizando...' : clientes.length ? 'Atualizar' : 'Carregar clientes'}
        </button>
      </div>

      <div className="rounded-2xl border border-[#e5e8ee] bg-white p-4">
        <label htmlFor="busca-clientes" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#607089]">
          Buscar por nome
        </label>
        <input
          id="busca-clientes"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Digite o nome do cliente..."
          className="w-full rounded-xl border border-[#dbe1ea] px-3 py-2.5 text-sm text-[#1f2937] outline-none transition focus:border-[#0b66d0] focus:ring-2 focus:ring-[#0b66d0]/15"
        />
      </div>

      {error && <ErrorState title="Erro ao carregar clientes" message={error} onRetry={fetchClientes} />}

      <div className="overflow-hidden rounded-2xl border border-[#e5e8ee] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#f8fafc]">
              <tr className="text-left text-xs uppercase tracking-wide text-[#607089]">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Data de criação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf1f7]">
              {loading ? (
                <tr>
                  <td className="px-4 py-5" colSpan={4}>
                    <SkeletonLoader lines={6} />
                  </td>
                </tr>
              ) : hasData ? (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="text-sm text-[#1f2937]">
                    <td className="px-4 py-3 font-medium">{cliente?.nome || '—'}</td>
                    <td className="px-4 py-3">{cliente?.email || '—'}</td>
                    <td className="px-4 py-3">{cliente?.telefone || '—'}</td>
                    <td className="px-4 py-3">{formatDateBR(cliente?.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8" colSpan={4}>
                    <EmptyState
                      title="Nenhum cliente encontrado"
                      message="Tente ajustar a busca para visualizar resultados."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
