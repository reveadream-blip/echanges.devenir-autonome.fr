import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await apiPostJson<{ ok: true }>('/api/auth/forgot-password', {
      email,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Compte</p>
        <h1>Mot de passe oublié</h1>
        <p className="lede">
          Indiquez l’adresse e-mail de votre compte. Si elle existe, vous recevrez un lien pour
          choisir un nouveau mot de passe (valide 1 h).
        </p>
      </header>

      {sent ? (
        <div className="card prose-block">
          <p className="callout small">
            Si un compte existe pour cette adresse, un e-mail avec un lien de réinitialisation vient
            d’être envoyé. Vérifiez aussi les courriers indésirables.
          </p>
          <Link className="btn btn-primary" to="/connexion">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form className="card prose-block" onSubmit={onSubmit}>
          <label className="small muted">
            E-mail
            <input
              className="form-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error ? <p className="callout small">{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Envoi…' : 'Envoyer le lien'}
          </button>
          <p className="small muted">
            <Link to="/connexion">Annuler</Link>
          </p>
        </form>
      )}
    </div>
  )
}
