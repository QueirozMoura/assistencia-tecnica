import { createContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_TOKEN = 'admin_token'
const STORAGE_KEY_USER  = 'admin_user'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN))
  const [loading, setLoading] = useState(true)  // true enquanto valida token inicial

  // ── Valida token salvo ao montar a aplicação ──────────────────────
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

    fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token inválido')
        return res.json()
      })
      .then((json) => {
        setUser(json.data)
      })
      .catch(() => {
        // Token expirado ou inválido — limpar estado
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_USER)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // executa apenas na montagem

  // ── login: recebe token + user já validados pelo adminApi ─────────
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  // ── logout: limpa tudo ────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user
  const isAdmin         = isAuthenticated && user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
