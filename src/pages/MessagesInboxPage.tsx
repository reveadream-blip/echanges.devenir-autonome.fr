import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dispatchUnreadRefresh } from '../hooks/useUnreadMessageCount'
import { apiGetJson } from '../lib/api'
import type { ExchangeThreadSummary } from '../types/api'

export function MessagesInboxPage() {
  const [threads, setThreads] = useState<ExchangeThreadSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetJson<{ threads: ExchangeThreadSummary[] }>(
        '/api/messages/threads',
      )
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.message)
        return
      }
      setThreads(res.data.threads ?? [])
      dispatchUnreadRefresh()
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="stack-lg">
        <p className="muted">Chargement de vos conversations…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="stack-lg">
        <p className="callout small">{error}</p>
        <Link className="btn btn-primary" to="/">
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Messagerie</p>
        <h1>Échanges autour des annonces</h1>
        <p className="lede">
          Chaque fil est lié à une annonce précise (troc ou compétence). Vous et l’auteur
          pouvez vous écrire sans révéler vos coordonnées personnelles.
        </p>
      </header>

      {threads.length === 0 ? (
        <p className="muted card prose-block">
          Aucune conversation pour l’instant. Ouvrez une annonce qui vous intéresse et utilisez
          « Écrire pour cet échange ».
        </p>
      ) : (
        <ul className="msg-inbox-list">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                className={`msg-thread-row card${t.has_unread ? ' msg-thread-row--unread' : ''}`}
                to={`/messages/${encodeURIComponent(t.id)}`}
              >
                <div className="msg-thread-row__meta">
                  <span className="msg-thread-row__pills">
                    <span className="pill">
                      {t.listing_kind === 'food' ? 'Troc' : 'Compétence'}
                    </span>
                    {t.has_unread ? (
                      <span className="msg-unread-dot" title="Nouveaux messages">
                        Nouveau
                      </span>
                    ) : null}
                  </span>
                  <span className="small muted">
                    {t.last_message_at != null
                      ? new Date(t.last_message_at * 1000).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </span>
                </div>
                <p className="msg-thread-row__title">{t.listing_title}</p>
                <p className="msg-thread-row__peer small muted">
                  Avec <strong>{t.counterpart_name}</strong>
                </p>
                {t.last_preview ? (
                  <p className="msg-thread-row__preview muted small">{t.last_preview}</p>
                ) : (
                  <p className="msg-thread-row__preview muted small">Pas encore de message.</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
