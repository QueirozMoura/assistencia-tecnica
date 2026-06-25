import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/**
 * Hook para consumir o AuthContext.
 * Deve ser usado dentro de <AuthProvider>.
 *
 * Retorna: { user, token, loading, isAuthenticated, isAdmin, login, logout }
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return ctx
}
