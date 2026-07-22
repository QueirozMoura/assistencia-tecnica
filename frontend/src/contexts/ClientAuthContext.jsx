import { createContext, useState, useEffect, useCallback } from 'react'
import { clientGetMe } from '../services/clientApi'

const STORAGE_KEY_TOKEN = 'client_token'
const STORAGE_KEY_CLIENT = 'client_user'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const ClientAuthContext = createContext(null)

function readStoredValue(key) {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

function clearStoredClientAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY_TOKEN)
  window.localStorage.removeItem(STORAGE_KEY_CLIENT)
}

export function ClientAuthProvider({ children }) {
  const [cliente, setCliente] = useState(null)
  const [token, setToken] = useState(() => readStoredValue(STORAGE_KEY_TOKEN))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function validateStoredToken() {
      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        const res = await fetch(`${BASE_URL}/client-auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Token inválido')

        const json = await res.json()
        if (!cancelled) setCliente(json.data)
      } catch {
        if (!cancelled) {
          clearStoredClientAuth()
          setToken(null)
          setCliente(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void validateStoredToken()
    return () => { cancelled = true }
  }, [token])

  const login = useCallback((newToken, newCliente) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_TOKEN, newToken)
      window.localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(newCliente))
    }
    setToken(newToken)
    setCliente(newCliente)
  }, [])

  const refreshCliente = useCallback(async () => {
    if (!token) return null
    const res = await clientGetMe()
    setCliente(res.data)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(res.data))
    }
    return res.data
  }, [token])

  const logout = useCallback(() => {
    clearStoredClientAuth()
    setToken(null)
    setCliente(null)
  }, [])

  const isAuthenticated = !!token && !!cliente

  return (
    <ClientAuthContext.Provider value={{ cliente, token, loading, isAuthenticated, login, logout, refreshCliente }}>
      {children}
    </ClientAuthContext.Provider>
  )
}
