import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

type Props = {
  listingKind: 'food' | 'skill'
  listingId: string
}

export function ExchangeChatButton({ listingKind, listingId }: Props) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function openThread() {
    setBusy(true)
    try {
      const res = await apiPostJson<{ thread: { id: string } }>(
        '/api/messages/threads',
        { listing_kind: listingKind, listing_id: listingId },
      )
      if (!res.ok) {
        window.alert(res.message)
        return
      }
      navigate(`/messages/${encodeURIComponent(res.data.thread.id)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={busy}
      onClick={() => void openThread()}
    >
      {busy ? 'Ouverture…' : 'Écrire pour cet échange'}
    </button>
  )
}
