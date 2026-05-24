import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { dispatchUnreadRefresh } from '../hooks/useUnreadMessageCount'
import { apiGetJson, apiPostJson } from '../lib/api'
import type { ExchangeMessage, ExchangeThreadDetail } from '../types/api'

export function MessagesThreadPage() {
  const rawId = useParams<{ threadId: string }>().threadId
  const threadId = rawId?.trim() ?? ''
  const { user } = useAuth()
  const listEndRef = useRef<HTMLDivElement | null>(null)

  const [thread, setThread] = useState<ExchangeThreadDetail | null>(null)
  const [messages, setMessages] = useState<ExchangeMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sendBusy, setSendBusy] = useState(false)

  useEffect(() => {
    if (!threadId) {
      setLoading(false)
      setError('Conversation invalide.')
      return
    }
    let cancelled = false
    void (async () => {
      const res = await apiGetJson<{
        thread: ExchangeThreadDetail
        messages: ExchangeMessage[]
      }>(`/api/messages/threads/${encodeURIComponent(threadId)}`)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.message)
        setThread(null)
        setMessages([])
        return
      }
      setError(null)
      setThread(res.data.thread)
      setMessages(res.data.messages ?? [])
      dispatchUnreadRefresh()
    })()
    return () => {
      cancelled = true
    }
  }, [threadId])

  useEffect(() => {
    queueMicrotask(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
  }, [messages])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!threadId || !draft.trim()) return
    setSendBusy(true)
    const res = await apiPostJson<{ message: ExchangeMessage }>(
      `/api/messages/threads/${encodeURIComponent(threadId)}/messages`,
      { body: draft.trim() },
    )
    setSendBusy(false)
    if (!res.ok) {
      window.alert(res.message)
      return
    }
    setDraft('')
    setMessages((prev) => [...prev, res.data.message])
    dispatchUnreadRefresh()
  }

  if (loading) {
    return (
      <div className="stack-lg">
        <p className="muted">Chargement…</p>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="stack-lg">
        <p className="callout small">{error ?? 'Conversation introuvable.'}</p>
        <Link className="btn btn-primary" to="/messages">
          Retour à la messagerie
        </Link>
      </div>
    )
  }

  return (
    <div className="stack-lg msg-thread-layout">
      <header className="page-header">
        <p className="eyebrow">
          <Link className="muted" to="/messages">
            ← Messagerie
          </Link>
        </p>
        <h1>{thread.listing_title}</h1>
        <p className="lede">
          <span className="pill">
            {thread.listing_kind === 'food' ? 'Troc' : 'Compétence'}
          </span>{' '}
          <span className="small muted">
            Discussion avec <strong>{thread.counterpart_name}</strong>
          </span>
        </p>
        <Link className="small" to={thread.listing_path}>
          Voir l’annonce
        </Link>
      </header>

      <div className="card msg-thread-scroll">
        <div className="msg-list" role="log" aria-live="polite">
          {messages.map((m) => {
            const mine = user?.id === m.sender_id
            return (
              <div
                key={m.id}
                className={`msg-bubble${mine ? ' msg-bubble--mine' : ' msg-bubble--them'}`}
              >
                <p className="msg-bubble__body">{m.body}</p>
                <time className="msg-bubble__time small muted" dateTime={new Date(m.created_at * 1000).toISOString()}>
                  {new Date(m.created_at * 1000).toLocaleString('fr-FR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
            )
          })}
          <div ref={listEndRef} />
        </div>

        <form className="msg-composer" onSubmit={(e) => void onSubmit(e)}>
          <label className="small muted">
            Votre message
            <textarea
              className="form-input form-textarea"
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={8000}
              placeholder="Proposition de rendez-vous, précisions sur l’échange…"
              required
              disabled={sendBusy}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={sendBusy}>
            {sendBusy ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  )
}
