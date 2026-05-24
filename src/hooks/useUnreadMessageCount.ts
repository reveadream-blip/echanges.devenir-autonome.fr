import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const REFRESH_EVENT = 'ts-unread-refresh'

export function dispatchUnreadRefresh() {
  window.dispatchEvent(new Event(REFRESH_EVENT))
}

export function useUnreadMessageCount(): number {
  const { user, ready } = useAuth()
  const location = useLocation()
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0)
      return
    }
    try {
      const r = await fetch('/api/messages/unread-count', { credentials: 'include' })
      if (!r.ok) return
      const data = (await r.json()) as { count?: unknown }
      const n = typeof data.count === 'number' ? data.count : 0
      setCount(Math.max(0, n))
    } catch {
      /* ignore */
    }
  }, [user])

  useEffect(() => {
    if (!ready || !user) {
      setCount(0)
      return
    }
    void fetchCount()
    const id = window.setInterval(() => void fetchCount(), 45_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchCount()
    }
    const onRefresh = () => void fetchCount()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener(REFRESH_EVENT, onRefresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener(REFRESH_EVENT, onRefresh)
    }
  }, [ready, user, fetchCount])

  useEffect(() => {
    if (!user) return
    if (location.pathname.startsWith('/messages')) {
      const t = window.setTimeout(() => void fetchCount(), 600)
      return () => window.clearTimeout(t)
    }
    return
  }, [location.pathname, user, fetchCount])

  return count
}
