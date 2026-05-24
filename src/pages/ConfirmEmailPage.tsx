import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiPostJson } from '../lib/api'
import { useAuth } from '../context/useAuth'

export function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const { reload } = useAuth()
  const [pending, setPending] = useState(() => token.length > 0)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(() =>
    token.length === 0 ? 'Lien incomplet ou invalide.' : null,
  )

  useEffect(() => {
    if (token.length === 0) return

    let cancelled = false
    void (async () => {
      const res = await apiPostJson<{ ok: true }>('/api/auth/verify-email', {
        token,
      })
      if (cancelled) return
      setPending(false)
      if (!res.ok) {
        setError(res.message)
        return
      }
      setOk(true)
      await reload()
    })()

    return () => {
      cancelled = true
    }
  }, [token, reload])

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Compte</p>
        <h1>Confirmation d’adresse e-mail</h1>
      </header>

      <div className="card prose-block">
        {pending ? <p className="muted">Vérification du lien…</p> : null}
        {!pending && ok ? (
          <>
            <p className="callout small">
              Votre adresse est confirmée. Vous pouvez utiliser le site normalement.
            </p>
            <Link className="btn btn-primary" to="/">
              Retour à l’accueil
            </Link>
          </>
        ) : null}
        {!pending && error ? (
          <>
            <p className="callout small">{error}</p>
            <p className="small muted">
              Demandez un nouveau lien depuis la page d’accueil (bandeau en haut si vous êtes
              connecté·e) ou refaites une inscription.
            </p>
            <Link className="btn btn-ghost" to="/connexion">
              Connexion
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
