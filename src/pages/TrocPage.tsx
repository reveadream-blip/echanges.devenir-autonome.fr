import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { FoodCategory } from '../data/demoListings'
import { fallbackFood } from '../lib/demoFallback'
import { apiDeleteJson } from '../lib/api'
import { getViewerCoords } from '../lib/geo'
import type { FoodListingPublic } from '../types/api'

const categories: FoodCategory[] = [
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
]

function getFoodImageUrl(title: string, category: string): string {
  const t = title.toLowerCase()

  if (t.includes('haricots rouges secs')) {
    return '/photos/haricots-rouges-secs.jpg'
  }
  if (t.includes('conserves de légumes') || t.includes('conserves de legumes')) {
    return '/photos/conserves-legumes.jpg'
  }
  if (t.includes('pommes de terre') || t.includes('pomme de terre')) {
    return '/photos/pommes-terre.jpg'
  }
  if (t.includes('haricots') || t.includes('haricot')) {
    return '/photos/haricots-rouges-secs.jpg'
  }
  if (t.includes('conserve') || t.includes('bocal')) {
    return '/photos/conserves-legumes.jpg'
  }
  if (t.includes('semence') || t.includes('graine')) {
    return '/photos/semences.jpg'
  }

  switch (category) {
    case 'Frais':
      return '/photos/section-01.jpg'
    case 'Sec':
      return '/photos/haricots-rouges-secs.jpg'
    case 'Conserves':
      return '/photos/conserves-legumes.jpg'
    case 'Semences':
      return '/photos/semences.jpg'
    case 'Boissons':
      return '/photos/section-02.jpg'
    case 'Épicerie':
      return '/photos/section-03.jpg'
    case 'Hygiène':
      return '/photos/section-04.jpg'
    case 'Viande':
      return '/photos/section-01.jpg'
    case 'Oeuf/Volaille':
      return '/photos/section-01.jpg'
    case 'Poisson':
      return '/photos/section-02.jpg'
    default:
      return '/photos/section-01.jpg'
  }
}

export function TrocPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [filter, setFilter] = useState<FoodCategory | 'Tous'>('Tous')
  const [rows, setRows] = useState<FoodListingPublic[]>([])
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
    if (filter !== 'Tous') params.set('category', filter)
    const qs = params.toString()
    const url = qs ? `/api/food?${qs}` : '/api/food'

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
        const data = payload as { listings?: FoodListingPublic[] }
        setLoadError(null)
        setRows(data.listings ?? [])
        setSource('api')
      } catch {
        if (cancelled) return
        setLoadError(null)
        setRows(fallbackFood())
        setSource('demo')
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [filter, listTick])

  async function deleteListing(listingId: string) {
    if (!window.confirm('Supprimer définitivement cette annonce ?')) return
    const res = await apiDeleteJson(`/api/food/${encodeURIComponent(listingId)}`)
    if (!res.ok) {
      window.alert(res.message)
      return
    }
    setListTick((t) => t + 1)
  }

  const filteredRows = useMemo(() => {
    if (filter === 'Tous') return rows
    return rows.filter((r) => r.category === filter)
  }, [rows, filter])

  function openListing(id: string) {
    navigate(`/troc/${encodeURIComponent(id)}`)
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Alimentaire</p>
        <h1>Troc et résilience</h1>
      </header>

      <div className="hero-actions">
        <Link className="btn btn-primary" to="/troc/nouveau">
          Publier une annonce
        </Link>
        <Link className="btn btn-ghost" to="/connexion">
          Connexion
        </Link>
      </div>

      {source === 'demo' ? (
        <p className="callout small">
          Mode secours : pas de réponse réseau — données locales affichées.
        </p>
      ) : null}
      {source === 'error' && loadError ? (
        <p className="callout small">{loadError}</p>
      ) : null}

      <div className="chip-row" role="group" aria-label="Filtrer par catégorie">
        <button
          type="button"
          className={`chip${filter === 'Tous' ? ' chip--active' : ''}`}
          onClick={() => setFilter('Tous')}
        >
          Tous
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${filter === c ? ' chip--active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="callout small">
        Les DLC et conditions de conservation restent sous la responsabilité de
        chaque participant. Pas de vente déguisée : cadre{' '}
        <strong>troc entre particuliers</strong>.
      </p>

      {source === 'loading' ? (
        <p className="muted">Chargement…</p>
      ) : (
        <ul className="listing-grid">
          {filteredRows.map((item) => (
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
                src={item.photo_url ?? getFoodImageUrl(item.title, item.category)}
                alt=""
              />
              <div className="listing-top">
                <span className="pill">{item.category}</span>
                <span className="small muted">{item.zone_label}</span>
              </div>
              <h2 className="listing-card__title">
                <Link to={`/troc/${encodeURIComponent(item.id)}`}>{item.title}</Link>
              </h2>
              <p className="muted small">{item.description}</p>
              <p className="exchange">{item.exchange}</p>
              <p className="small muted">
                Par : <strong>{item.author_name}</strong>
              </p>
              {item.resilience_points != null ? (
                <p className="small muted">
                  Points de résilience suggérés :{' '}
                  <span className="nowrap">{item.resilience_points} pts</span>
                </p>
              ) : null}
              {user && source === 'api' && item.mine ? (
                <div className="listing-card__actions" onClick={(e) => e.stopPropagation()}>
                  <Link
                    className="btn btn-ghost btn-sm"
                    to={`/troc/${encodeURIComponent(item.id)}/modifier`}
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
