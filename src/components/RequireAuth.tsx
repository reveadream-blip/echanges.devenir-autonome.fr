import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function RequireAuth({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <p className="muted">Chargement du compte…</p>
  }
  if (!user) {
    return (
      <Navigate to="/connexion" replace state={{ from: location.pathname }} />
    )
  }
  return children
}
