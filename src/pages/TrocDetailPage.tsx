import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListingGeoBlock } from '../components/ListingGeoBlock'
import { ListingMessagingBlock } from '../components/ListingMessagingBlock'
import { useAuth } from '../context/useAuth'
import { apiGetJson } from '../lib/api'
import type { FoodListingPublic } from '../types/api'

function getFoodFallbackImage(title: string, category: string): string {
  const t = title.toLowerCase()
  if (t.includes('haricots rouges secs')) return '/photos/haricots-rouges-secs.jpg'
  if (t.includes('conserves')) return '/photos/conserves-legumes.jpg'
  if (t.includes('pommes de terre') || t.includes('pomme de terre'))
    return '/photos/pommes-terre.jpg'
  if (t.includes('semence') || t.includes('graine')) return '/photos/semences.jpg'
  switch (category) {
    case 'Frais':
      return '/photos/section-01.jpg'
    case 'Sec':
      return '/photos/haricots-rouges-secs.jpg'
    case 'Conserves':
      return '/photos/conserves-legumes.jpg'
    case 'Semences':
      return '/photos/semences.jpg'
    default:
      return '/photos/section-01.jpg'
  }
}

export function TrocDetailPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId?.trim() ?? ''
  const { user, ready } = useAuth()
  const [listing, setListing] = useState<FoodListingPublic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Annonce invalide.')
      return
    }
    let cancelled = false
    void (async () => {
      const res = await apiGetJson<{ listing: FoodListingPublic }>(
        `/api/public/food/${encodeURIComponent(id)}`,
      )
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.message)
        return
      }
      setListing(res.data.listing)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="stack-lg">
        <p className="muted">Chargement…</p>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="stack-lg">
        <p className="callout small">{error ?? 'Annonce introuvable.'}</p>
        <Link className="btn btn-primary" to="/troc">
          Retour au troc alimentaire
        </Link>
      </div>
    )
  }

  const imgSrc =
    listing.photo_url ?? getFoodFallbackImage(listing.title, listing.category)

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Alimentaire</p>
        <div className="listing-detail-top">
          <img className="listing-detail-photo" src={imgSrc} alt="" />
          <div>
            <div className="listing-top">
              <span className="pill">{listing.category}</span>
              <span className="small muted">{listing.zone_label}</span>
            </div>
            <h1>{listing.title}</h1>
            <p className="small muted">
              Par <strong>{listing.author_name}</strong>
            </p>
          </div>
        </div>
      </header>

      <div className="card prose-block">
        <h2>Description</h2>
        <p>{listing.description}</p>
        <h2>Échange</h2>
        <p className="exchange">{listing.exchange}</p>
        {listing.resilience_points != null ? (
          <p className="small muted">
            Points de résilience suggérés : {listing.resilience_points} pts
          </p>
        ) : null}
      </div>

      <section className="card prose-block">
        <h2>
          {listing.mine && ready && user
            ? 'Messages pour cette annonce'
            : 'Contacter l’auteur'}
        </h2>
        <ListingMessagingBlock listingKind="food" listingId={listing.id} mine={listing.mine} />
        {listing.contact_phone ? (
          <p>
            <a href={`tel:${listing.contact_phone.replace(/\s/g, '')}`}>
              {listing.contact_phone}
            </a>{' '}
            <span className="small muted">(téléphone)</span>
          </p>
        ) : null}
        {listing.contact_email ? (
          <p>
            <a href={`mailto:${listing.contact_email}`}>
              {listing.contact_email}
            </a>{' '}
            <span className="small muted">(e-mail)</span>
          </p>
        ) : null}
        {!listing.contact_phone && !listing.contact_email ? (
          <p className="muted small">Aucun téléphone ni e-mail renseignés sur cette annonce.</p>
        ) : null}
      </section>

      <ListingGeoBlock approx_lat={listing.approx_lat} approx_lng={listing.approx_lng} />

      <div className="hero-actions">
        <Link className="btn btn-ghost" to="/troc">
          ← Liste des annonces
        </Link>
        {user && listing.mine ? (
          <Link className="btn btn-primary" to={`/troc/${encodeURIComponent(listing.id)}/modifier`}>
            Modifier l’annonce
          </Link>
        ) : null}
      </div>
    </div>
  )
}
