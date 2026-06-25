import { createContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY_TOKEN  = 'client_token'
const STORAGE_KEY_CLIENT = 'client_user'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const ClientAuthContext = createContext(null)

export function ClientAuthProvider({ children }) {
  const [cliente,  setCliente]  = useState(null)
  const [token,    setToken]    = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN))
  const [loading,  setLoading]  = useState(true)

  // Valida token salvo ao montar
  useEffect(() => {
    if (!token) { setLoading(false); return }

    fetch(`${BASE_URL}/client-auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token inválido')
        return res.json()
      })
      .then((json) => setCliente(json.data))
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_CLIENT)
        setToken(null)
        setCliente(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((newToken, newCliente) => {
    localStorage.setItem(STORAGE_KEY_TOKEN,  newToken)
    localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(newCliente))
    setToken(newToken)
    setCliente(newCliente)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_CLIENT)
    setToken(null)
    setCliente(null)
  }, [])

  const isAuthenticated = !!token && !!cliente

  return (
    <ClientAuthContext.Provider value={{ cliente, token, loading, isAuthenticated, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  )
}
