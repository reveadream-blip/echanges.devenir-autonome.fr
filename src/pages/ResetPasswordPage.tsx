import { type FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('Lien incomplet ou invalide.')
      return
    }
    if (password.length < 10) {
      setError('Mot de passe : au moins 10 caractères.')
      return
    }
    if (password !== password2) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setPending(true)
    const res = await apiPostJson<{ ok: true }>('/api/auth/reset-password', {
      token,
      password,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setDone(true)
  }

  if (!token) {
    return (
      <div className="stack-lg">
        <header className="page-header">
          <p className="eyebrow">Compte</p>
          <h1>Lien invalide</h1>
        </header>
        <div className="card prose-block">
          <p className="callout small">
            Ouvrez le lien reçu par e-mail, ou demandez un nouveau lien depuis « Mot de passe oublié
            ».
          </p>
          <Link className="btn btn-primary" to="/mot-de-passe-oublie">
            Mot de passe oublié
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="stack-lg">
        <header className="page-header">
          <p className="eyebrow">Compte</p>
          <h1>Mot de passe mis à jour</h1>
        </header>
        <div className="card prose-block">
          <p className="callout small">
            Vous pouvez vous connecter avec votre nouveau mot de passe. Les sessions précédentes ont
            été déconnectées.
          </p>
          <Link className="btn btn-primary" to="/connexion">
            Connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Compte</p>
        <h1>Nouveau mot de passe</h1>
        <p className="lede">Choisissez un mot de passe d’au moins 10 caractères.</p>
      </header>

      <form className="card prose-block" onSubmit={onSubmit}>
        <label className="small muted">
          Nouveau mot de passe
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
        <label className="small muted">
          Confirmer le mot de passe
          <input
            className="form-input"
            type="password"
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            minLength={10}
            required
          />
        </label>
        {error ? <p className="callout small">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
