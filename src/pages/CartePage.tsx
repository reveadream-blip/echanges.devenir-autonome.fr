export function CartePage() {
  return (
    <div className="stack-lg">
      <header className="page-header">
        <h1>Carte de proximité</h1>
        <p className="muted">
          Intégration prévue (MapLibre GL ou Leaflet + tuiles sobres). Les points
          afficheront une <strong>zone approximative</strong> (grappe hexagonale ou
          cercle élargi), pas le lieu exact du stock.
        </p>
      </header>

      <div className="placeholder-map card">
        <p>
          Carte interactive à brancher sur votre backend géographique. Pensez à
          limiter la précision côté serveur et à journaliser les accès pour détecter
          les abus.
        </p>
        <ul className="muted small checklist">
          <li>Rayon par défaut 5–10 km sélectionnable.</li>
          <li>Pas d’adresse complète dans les payloads publics.</li>
          <li>Échanges détaillés via canal privé authentifié.</li>
        </ul>
      </div>
    </div>
  )
}
