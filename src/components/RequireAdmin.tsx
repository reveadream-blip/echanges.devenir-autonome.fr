import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { isAdminUser } from '../lib/admin'

export function RequireAdmin({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return <p className="muted">Chargement du compte…</p>
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />
  }
  return children
}
