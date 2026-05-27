import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiPostJson } from '../lib/api'
import { useAuth } from '../context/useAuth'
import type { AuthUser } from '../types/api'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reload } = useAuth()
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/connexion'
      ? (location.state as { from: string }).from
      : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await apiPostJson<{ user: AuthUser }>('/api/auth/login', {
      email,
      password,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    await reload()
    navigate(from, { replace: true })
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Compte</p>
        <h1>Connexion</h1>
        <p className="lede">
          Connectez-vous pour publier une annonce, répondre aux messages et gérer
          votre profil.
        </p>
      </header>

      <form className="card prose-block" onSubmit={onSubmit}>
        <label className="small muted">
          Email
          <input
            className="form-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="small muted">
          Mot de passe
          <input
            className="form-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="callout small">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="small muted">
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </p>
        <p className="small muted">
          Pas encore de compte ?{' '}
          <Link to="/inscription">Créer un profil</Link>
        </p>
      </form>
    </div>
  )
}
