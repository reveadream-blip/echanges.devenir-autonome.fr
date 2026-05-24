import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ListingPhotoField,
  type ListingPhotoPayload,
} from '../components/ListingPhotoField'
import { apiGetJson, apiPatchJson } from '../lib/api'
import type { SkillListingEditable, SkillListingPublic } from '../types/api'

type PhotoPatch = 'keep' | 'clear' | 'replace'

export function ModifierCompetencePage() {
  const rawId = useParams<{ id: string }>().id
  const id = rawId?.trim() ?? ''
  const invalidId = id.length === 0
  const navigate = useNavigate()
  const listingRef = useRef<SkillListingEditable | null>(null)

  const [loadError, setLoadError] = useState<string | null>(() =>
    invalidId ? 'Annonce invalide.' : null,
  )
  const [loading, setLoading] = useState(() => !invalidId)
  const [listing, setListing] = useState<SkillListingEditable | null>(null)

  const [title, setTitle] = useState('')
  const [offer, setOffer] = useState('')
  const [hoping_for, setHopingFor] = useState('')
  const [{ lat, lng }, setPos] = useState({ lat: 48.8566, lng: 2.3522 })
  const [geoBusy, setGeoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [photoPatch, setPhotoPatch] = useState<PhotoPatch>('keep')
  const [photoNew, setPhotoNew] = useState<ListingPhotoPayload | null>(null)
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  useEffect(() => {
    listingRef.current = listing
  }, [listing])

  useEffect(() => {
    if (invalidId) return
    let cancelled = false
    void (async () => {
      const res = await apiGetJson<{ listing: SkillListingEditable }>(
        `/api/skills/${encodeURIComponent(id)}`,
      )
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setLoadError(res.message)
        return
      }
      const L = res.data.listing
      setListing(L)
      setTitle(L.title)
      setOffer(L.offer)
      setHopingFor(L.hoping_for)
      setPos({ lat: L.lat, lng: L.lng })
      setContactPhone(L.contact_phone?.trim() ?? '')
      setContactEmail(L.contact_email?.trim() ?? '')
      setPhotoPatch('keep')
      setPhotoNew(null)
    })()
    return () => {
      cancelled = true
    }
  }, [id, invalidId])

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

  function handlePhotoChange(p: ListingPhotoPayload | null) {
    if (p === null) {
      setPhotoNew(null)
      setPhotoPatch(listingRef.current?.photo_url ? 'clear' : 'keep')
      return
    }
    setPhotoNew(p)
    setPhotoPatch('replace')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
    setError(null)
    setPending(true)
    const body: Record<string, unknown> = {
      title,
      offer,
      hoping_for,
      lat,
      lng,
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
    }
    if (photoPatch === 'clear') body.clear_photo = true
    else if (photoPatch === 'replace' && photoNew) body.photo = photoNew

    const res = await apiPatchJson<{ listing: SkillListingPublic }>(
      `/api/skills/${encodeURIComponent(id)}`,
      body,
    )
    setPending(false)
    if (!res.ok) {
      setError(res.message)
      return
    }
    navigate('/competences')
  }

  if (loading) {
    return (
      <div className="stack-lg">
        <p className="muted">Chargement de la proposition…</p>
      </div>
    )
  }

  if (loadError || !listing || !id) {
    return (
      <div className="stack-lg">
        <p className="callout small">{loadError ?? 'Annonce introuvable.'}</p>
        <Link className="btn btn-primary" to="/competences">
          Retour aux compétences
        </Link>
      </div>
    )
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Publication</p>
        <h1>Modifier la proposition — compétences</h1>
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

        <ListingPhotoField
          disabled={pending}
          existingPhotoUrl={listing.photo_url}
          onPhotoChange={handlePhotoChange}
        />

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
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
        <p className="small muted">
          <Link to="/competences">Annuler</Link>
        </p>
      </form>
    </div>
  )
}
