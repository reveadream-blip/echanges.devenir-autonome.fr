import { lazy, Suspense } from 'react'

const ProximityMap = lazy(() => import('../components/ProximityMap'))

export function CartePage() {
  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">5 à 10 km</p>
        <h1>Vue de proximité</h1>
        <p className="lede">
          Carte OpenStreetMap avec cercles indicatifs. Activez la position dans
          le navigateur pour afficher une estimation de distance sur les fiches
          et recentrer la vue ; ces coordonnées ne sont pas envoyées au serveur
          tant que vous ne les réutilisez pas dans une annonce.
        </p>
      </header>

      <Suspense
        fallback={
          <section className="card placeholder-map">
            <p className="muted">Chargement de la carte…</p>
          </section>
        }
      >
        <ProximityMap />
      </Suspense>

    </div>
  )
}
