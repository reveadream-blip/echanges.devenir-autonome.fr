import {
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  googleStreetViewUrl,
} from '../lib/mapLinks'

type Props = {
  approx_lat: number
  approx_lng: number
}

export function ListingGeoBlock({ approx_lat, approx_lng }: Props) {
  return (
    <section className="listing-geo-block card prose-block">
      <h2 className="listing-geo-block__title">Carte & déplacement</h2>
      <p className="small muted">
        Point affiché selon la <strong>même grille approximative (~1 km)</strong> que sur la liste et
        la carte — pas de précision à l’adresse.
      </p>
      <div className="listing-geo-block__actions">
        <a
          className="btn btn-primary"
          href={googleMapsDirectionsUrl(approx_lat, approx_lng)}
          target="_blank"
          rel="noreferrer"
        >
          Itinéraire (Google Maps)
        </a>
        <a
          className="btn btn-ghost"
          href={googleStreetViewUrl(approx_lat, approx_lng)}
          target="_blank"
          rel="noreferrer"
        >
          Street View (Google Maps)
        </a>
      </div>
      <iframe
        className="listing-map-embed"
        title="Aperçu carte Google"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={googleMapsEmbedUrl(approx_lat, approx_lng, 13)}
      />
    </section>
  )
}
