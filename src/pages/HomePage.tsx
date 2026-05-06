import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <p className="eyebrow">Réseau local de résilience</p>
        <h1>Organiser l’entraide quand les circuits courts comptent</h1>
        <p className="lede">
          Cette application vise le <strong>troc alimentaire</strong>, la{' '}
          <strong>banque de compétences</strong> et une{' '}
          <strong>carte de proximité</strong> sans exposer d’adresse précise : les
          rendez-vous se précisent en messagerie privée (à brancher en phase 2).
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/troc">
            Voir les annonces démo
          </Link>
          <Link className="btn btn-ghost" to="/informations">
            Cadre légal & confidentialité
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <h2>Troc alimentaire</h2>
          <p className="muted">
            Catégories frais, sec, conserves et semences. Troc direct ou futurs
            « points de résilience » sans monétisation obligatoire.
          </p>
          <Link className="text-link" to="/troc">
            Accéder au module →
          </Link>
        </article>
        <article className="card">
          <h2>Compétences</h2>
          <p className="muted">
            Échanges type banque de temps : réparation, jardinage, transmission de
            savoir-faire.
          </p>
          <Link className="text-link" to="/competences">
            Voir les exemples →
          </Link>
        </article>
        <article className="card">
          <h2>Proximité</h2>
          <p className="muted">
            Carte interactive prévue (5–10 km). Les stocks sensibles restent
            floutés ; seules des zones approximatives sont affichées.
          </p>
          <Link className="text-link" to="/carte">
            État d’avancement →
          </Link>
        </article>
      </section>

      <aside className="callout">
        <strong>PWA hors-ligne.</strong> Après une première visite en ligne, le
        navigateur pourra conserver la coque et les derniers fichiers statiques servis
        — utile si le réseau devient capricieux. Les données dynamiques suivront via
        synchro ultérieure (API + cache).
      </aside>
    </div>
  )
}
