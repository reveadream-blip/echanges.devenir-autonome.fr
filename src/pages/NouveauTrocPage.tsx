import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ListingPhotoField,
  type ListingPhotoPayload,
} from '../components/ListingPhotoField'
import { apiPostJson } from '../lib/api'
import type { FoodListingPublic } from '../types/api'

const cats = [
  'Frais',
  'Sec',
  'Conserves',
  'Semences',
  'Boissons',
  'Épicerie',
  'Hygiène',
  'Viande',
  'Oeuf/Volaille',
  'Poisson',
] as const

function fallbackParis(): { lat: number; lng: number } {
  return { lat: 48.8566, lng: 2.3522 }
}

export function NouveauTrocPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<(typeof cats)[number]>('Sec')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [exchange, setExchange] = useState('')
  const [resiliencePoints, setResiliencePoints] = useState('')
  const [{ lat, lng }, setPos] = useState(fallbackParis)
  const [geoBusy, setGeoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [photo, setPhoto] = useState<ListingPhotoPayload | null>(null)
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  function useMyPosition() {
    if (!navigator.geolocation) {
      setError('Géolocalisation non disponible sur ce navigateur.')
      return
    }
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoBusy(false)
      },
      () => {
        setGeoBusy(false)
        setError(
          'Impossible de lire la position. Choisissez manuellement ou réessayez.',
        )
      },
      { enableHighAccuracy: false, timeout: 12_000 },
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const rp =
      resiliencePoints.trim() === ''
        ? null
        : Number.parseInt(resiliencePoints, 10)
    const body = {
      category,
      title,
      description,
      exchange,
      resilience_points:
        rp != null && Number.isFinite(rp) ? rp : null,
      lat,
      lng,
      ...(photo ? { photo } : {}),
      ...(contactPhone.trim() ? { contact_phone: contactPhone.trim() } : {}),
      ...(contactEmail.trim() ? { contact_email: contactEmail.trim() } : {}),
    }
    const res = await apiPostJson<{ listing: FoodListingPublic }>(
      '/api/food',
      body,
    )
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    navigate('/troc')
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Publication</p>
        <h1>Nouvelle annonce — troc</h1>
        <p className="lede">
          Les coordonnées servent à placer une zone sur la carte ; seule une
          grille approximative (~1 km) est visible publiquement.
        </p>
      </header>

      <form className="card prose-block" onSubmit={onSubmit}>
        <label className="small muted">
          Catégorie
          <select
            className="form-input"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof cats)[number])
            }
          >
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="small muted">
          Titre
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={120}
          />
        </label>
        <label className="small muted">
          Description
          <textarea
            className="form-input form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={4}
          />
        </label>
        <label className="small muted">
          Ce que vous proposez / attendez en échange
          <textarea
            className="form-input form-textarea"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            required
            minLength={5}
            maxLength={2000}
            rows={3}
          />
        </label>
        <label className="small muted">
          Points de résilience (optionnel)
          <input
            className="form-input"
            type="number"
            min={0}
            value={resiliencePoints}
            onChange={(e) => setResiliencePoints(e.target.value)}
            placeholder="Laisser vide pour troc pur"
          />
        </label>
        <label className="small muted">
          Téléphone de contact (optionnel)
          <input
            className="form-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Visible sur la fiche publique"
            maxLength={48}
          />
        </label>
        <label className="small muted">
          E-mail de contact (optionnel)
          <input
            className="form-input"
            type="email"
            autoComplete="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Peut être différent du compte"
          />
        </label>

        <ListingPhotoField disabled={pending} onPhotoChange={setPhoto} />

        <div className="coord-grid">
          <label className="small muted">
            Latitude (interne)
            <input
              className="form-input"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setPos((p) => ({ ...p, lat: +e.target.value }))}
              required
            />
          </label>
          <label className="small muted">
            Longitude (interne)
            <input
              className="form-input"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setPos((p) => ({ ...p, lng: +e.target.value }))}
              required
            />
          </label>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={useMyPosition}
            disabled={geoBusy}
          >
            {geoBusy ? 'Position…' : 'Utiliser ma position'}
          </button>
        </div>

        {error ? <p className="callout small">{error}</p> : null}

        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? 'Publication…' : 'Publier'}
        </button>
        <p className="small muted">
          <Link to="/troc">Annuler</Link>
        </p>
      </form>
    </div>
  )
}
