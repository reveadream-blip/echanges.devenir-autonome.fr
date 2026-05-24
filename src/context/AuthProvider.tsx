import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '../types/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  const reload = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' })
      const data = (await r.json()) as { user: AuthUser | null }
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void reload()
    })
  }, [reload])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, ready, reload, logout }),
    [user, ready, reload, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
