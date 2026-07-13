import { createContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_TOKEN = 'admin_token'
const STORAGE_KEY_USER  = 'admin_user'

export const AuthContext = createContext(null)

function readStoredValue(key) {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(key)
}

function clearStoredAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY_TOKEN)
  window.localStorage.removeItem(STORAGE_KEY_USER)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => readStoredValue(STORAGE_KEY_TOKEN))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function validateStoredToken() {
      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }

      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error('Token inválido')

        const json = await res.json()
        if (!cancelled) setUser(json.data)
      } catch {
        if (!cancelled) {
          clearStoredAuth()
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void validateStoredToken()
    return () => { cancelled = true }
  }, [token])

  const login = useCallback((newToken, newUser) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_TOKEN, newToken)
      window.localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser))
    }
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user
  const isAdmin = isAuthenticated && user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
