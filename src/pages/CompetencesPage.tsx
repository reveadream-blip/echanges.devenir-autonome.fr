import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { fallbackSkills } from '../lib/demoFallback'
import { apiDeleteJson } from '../lib/api'
import { getViewerCoords } from '../lib/geo'
import type { SkillListingPublic } from '../types/api'

function getSkillImageUrl(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('serrure')) {
    return '/photos/skill-serrure.jpg'
  }
  if (t.includes('conservation') || t.includes('bocaux') || t.includes('bocal')) {
    return '/photos/skill-conservation.jpg'
  }
  if (t.includes('couture') || t.includes('textile') || t.includes('sac')) {
    return '/photos/skill-couture.jpg'
  }
  if (t.includes('potager') || t.includes('jardin') || t.includes('greffe')) {
    return '/photos/skill-potager.jpg'
  }
  return '/photos/skill-default.jpg'
}

export function CompetencesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rows, setRows] = useState<SkillListingPublic[]>([])
  const [source, setSource] = useState<'api' | 'demo' | 'loading' | 'error'>(
    'loading',
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [listTick, setListTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setSource('loading')
    })
    const params = new URLSearchParams()
    const viewer = getViewerCoords()
    if (viewer) {
      params.set('viewer_lat', String(viewer.lat))
      params.set('viewer_lng', String(viewer.lng))
    }
    const qs = params.toString()
    const url = qs ? `/api/skills?${qs}` : '/api/skills'

    async function run() {
      try {
        const r = await fetch(url, { credentials: 'include' })
        const rawText = await r.text()
        let payload: unknown = null
        if (rawText) {
          try {
            payload = JSON.parse(rawText) as unknown
          } catch {
            payload = null
          }
        }
        if (!r.ok) {
          if (cancelled) return
          const msg =
            typeof payload === 'object' &&
            payload !== null &&
            'error' in payload &&
            typeof (payload as { error?: unknown }).error === 'string'
              ? (payload as { error: string }).error
              : `Erreur serveur (${r.status}). Réessayez dans un instant.`
          setLoadError(msg)
          setRows([])
          setSource('error')
          return
        }
        if (cancelled) return
        const data = payload as { listings?: SkillListingPublic[] }
        setLoadError(null)
        setRows(data.listings ?? [])
        setSource('api')
      } catch {
        if (cancelled) return
        setLoadError(null)
        setRows(fallbackSkills())
        setSource('demo')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [listTick])

  async function deleteListing(listingId: string) {
    if (!window.confirm('Supprimer définitivement cette proposition ?')) return
    const res = await apiDeleteJson(`/api/skills/${encodeURIComponent(listingId)}`)
    if (!res.ok) {
      window.alert(res.message)
      return
    }
    setListTick((t) => t + 1)
  }

  function openListing(id: string) {
    navigate(`/competences/${encodeURIComponent(id)}`)
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Banque de temps</p>
        <h1>Échange de bons procédés</h1>
        <p className="lede">
          Données persistées côté serveur ; publiez après connexion pour
          enrichir la communauté locale.
        </p>
      </header>

      <div className="hero-actions">
        <Link className="btn btn-primary" to="/competences/nouveau">
          Proposer une compétence
        </Link>
        <Link className="btn btn-ghost" to="/connexion">
          Connexion
        </Link>
      </div>

      {source === 'demo' ? (
        <p className="callout small">
          Mode secours : pas de réponse réseau — jeu de données locales.
        </p>
      ) : null}
      {source === 'error' && loadError ? (
        <p className="callout small">{loadError}</p>
      ) : null}

      {source === 'loading' ? (
        <p className="muted">Chargement…</p>
      ) : (
        <ul className="listing-grid">
          {rows.map((item) => (
            <li
              key={item.id}
              className="card listing-card listing-card--clickable"
              role="link"
              tabIndex={0}
              onClick={() => openListing(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openListing(item.id)
                }
              }}
            >
              <img
                className="listing-photo"
                src={item.photo_url ?? getSkillImageUrl(item.title)}
                alt=""
              />
              <div className="listing-top">
                <span className="pill pill--skills">Compétence</span>
                <span className="small muted">{item.zone_label}</span>
              </div>
              <h2 className="listing-card__title">
                <Link to={`/competences/${encodeURIComponent(item.id)}`}>
                  {item.title}
                </Link>
              </h2>
              <p className="muted small">
                <strong>Je propose :</strong> {item.offer}
              </p>
              <p className="exchange">
                <strong>J’espère en retour :</strong> {item.hoping_for}
              </p>
              <p className="small muted">
                Par : <strong>{item.author_name}</strong>
              </p>
              {user && source === 'api' && item.mine ? (
                <div className="listing-card__actions" onClick={(e) => e.stopPropagation()}>
                  <Link
                    className="btn btn-ghost btn-sm"
                    to={`/competences/${encodeURIComponent(item.id)}/modifier`}
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      void deleteListing(item.id)
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
