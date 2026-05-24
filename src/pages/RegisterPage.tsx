import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPostJson } from '../lib/api'
import { useAuth } from '../context/useAuth'
import type { AuthUser } from '../types/api'

export function RegisterPage() {
  const navigate = useNavigate()
  const { reload } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await apiPostJson<{ user: AuthUser }>('/api/auth/register', {
      email,
      password,
      display_name: pseudo,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    await reload()
    navigate('/', { replace: true })
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Compte</p>
        <h1>Inscription</h1>
        <p className="lede">
          Pseudonyme public pour vos annonces. L’adresse exacte n’apparaît pas
          sur les fiches ; la carte montre seulement une zone floutée. Après
          inscription, un e-mail de confirmation vous sera envoyé (pensez aux
          courriers indésirables).
        </p>
      </header>

      <form className="card prose-block" onSubmit={onSubmit}>
        <label className="small muted">
          Pseudo affiché
          <input
            className="form-input"
            type="text"
            autoComplete="nickname"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            minLength={2}
            maxLength={80}
            required
          />
        </label>
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
          Mot de passe (10 caractères minimum)
          <input
            className="form-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={10}
            required
          />
        </label>
        {error ? <p className="callout small">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Création…' : 'Créer mon compte'}
        </button>
        <p className="small muted">
          Déjà inscrit ? <Link to="/connexion">Connexion</Link>
        </p>
      </form>
    </div>
  )
}
