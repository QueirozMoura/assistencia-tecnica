import { Navigate, useLocation } from 'react-router-dom'
import { useClientAuth } from '../../hooks/useClientAuth'

export default function ClientPrivateRoute({ children }) {
  const { isAuthenticated, loading } = useClientAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff]">
        <div className="w-10 h-10 border-4 border-[#0070ea] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
