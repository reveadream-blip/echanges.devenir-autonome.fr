import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListingGeoBlock } from '../components/ListingGeoBlock'
import { ListingMessagingBlock } from '../components/ListingMessagingBlock'
import { useAuth } from '../context/useAuth'
import { apiGetJson } from '../lib/api'
import type { SkillListingPublic } from '../types/api'

function getSkillFallbackImage(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('serrure')) return '/photos/skill-serrure.jpg'
  if (t.includes('conservation') || t.includes('bocaux') || t.includes('bocal'))
    return '/photos/skill-conservation.jpg'
  if (t.includes('couture') || t.includes('textile') || t.includes('sac'))
    return '/photos/skill-couture.jpg'
  if (t.includes('potager') || t.includes('jardin') || t.includes('greffe'))
    return '/photos/skill-potager.jpg'
  return '/photos/skill-default.jpg'
}

export function CompetenceDetailPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId?.trim() ?? ''
  const { user, ready } = useAuth()
  const [listing, setListing] = useState<SkillListingPublic | null>(null)
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
      const res = await apiGetJson<{ listing: SkillListingPublic }>(
        `/api/public/skills/${encodeURIComponent(id)}`,
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
        <Link className="btn btn-primary" to="/competences">
          Retour aux compétences
        </Link>
      </div>
    )
  }

  const imgSrc = listing.photo_url ?? getSkillFallbackImage(listing.title)

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Compétences</p>
        <div className="listing-detail-top">
          <img className="listing-detail-photo" src={imgSrc} alt="" />
          <div>
            <div className="listing-top">
              <span className="pill pill--skills">Compétence</span>
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
        <h2>Je propose</h2>
        <p>{listing.offer}</p>
        <h2>J’espère en retour</h2>
        <p>{listing.hoping_for}</p>
      </div>

      <section className="card prose-block">
        <h2>
          {listing.mine && ready && user
            ? 'Messages pour cette annonce'
            : 'Contacter l’auteur'}
        </h2>
        <ListingMessagingBlock listingKind="skill" listingId={listing.id} mine={listing.mine} />
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
        <Link className="btn btn-ghost" to="/competences">
          ← Liste des compétences
        </Link>
        {user && listing.mine ? (
          <Link
            className="btn btn-primary"
            to={`/competences/${encodeURIComponent(listing.id)}/modifier`}
          >
            Modifier la proposition
          </Link>
        ) : null}
      </div>
    </div>
  )
}
