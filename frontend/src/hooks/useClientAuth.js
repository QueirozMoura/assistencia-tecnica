import { useContext } from 'react'
import { ClientAuthContext } from '../contexts/ClientAuthContext'

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext)

  // Fallback defensivo para evitar crash total de runtime
  if (!ctx) {
    return {
      cliente: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      login: () => {
        throw new Error('ClientAuthContext indisponível')
      },
      logout: () => {},
    }
  }

  return ctx
}
