import { useContext } from 'react'
import { AuthContext } from './auth-context'
import type { AuthState } from './auth-types'

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
