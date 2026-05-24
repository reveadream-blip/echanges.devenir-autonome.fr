import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ListingPhotoField,
  type ListingPhotoPayload,
} from '../components/ListingPhotoField'
import { apiPostJson } from '../lib/api'
import type { SkillListingPublic } from '../types/api'

function fallbackParis(): { lat: number; lng: number } {
  return { lat: 48.8566, lng: 2.3522 }
}

export function NouvelleCompetencePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [offer, setOffer] = useState('')
  const [hoping_for, setHopingFor] = useState('')
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
    const res = await apiPostJson<{ listing: SkillListingPublic }>(
      '/api/skills',
      {
        title,
        offer,
        hoping_for,
        lat,
        lng,
        ...(photo ? { photo } : {}),
        ...(contactPhone.trim() ? { contact_phone: contactPhone.trim() } : {}),
        ...(contactEmail.trim() ? { contact_email: contactEmail.trim() } : {}),
      },
    )
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    navigate('/competences')
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Publication</p>
        <h1>Nouvelle proposition — compétences</h1>
        <p className="lede">
          Décrivez ce que vous offrez et ce qui vous aiderait en retour. La carte
          n’affiche qu’une zone indicative.
        </p>
      </header>

      <form className="card prose-block" onSubmit={onSubmit}>
        <label className="small muted">
          Titre court
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
          Je propose
          <textarea
            className="form-input form-textarea"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={4}
          />
        </label>
        <label className="small muted">
          J’espère en retour
          <textarea
            className="form-input form-textarea"
            value={hoping_for}
            onChange={(e) => setHopingFor(e.target.value)}
            required
            minLength={5}
            maxLength={2000}
            rows={3}
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
          <Link to="/competences">Annuler</Link>
        </p>
      </form>
    </div>
  )
}
