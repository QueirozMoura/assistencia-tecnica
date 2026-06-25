import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Protege rotas administrativas.
 *
 * Comportamento:
 *   - loading=true  → exibe spinner enquanto valida token inicial
 *   - não autenticado → redireciona para /admin/login (preserva destino em state)
 *   - autenticado mas role !== ADMIN → redireciona para /admin/login com mensagem
 *   - autenticado + ADMIN → renderiza children
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  // Aguarda validação do token salvo no localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#737780] font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Não autenticado → login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Autenticado mas sem permissão de admin
  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location, error: 'Acesso restrito a administradores.' }}
        replace
      />
    )
  }

  return children
}
