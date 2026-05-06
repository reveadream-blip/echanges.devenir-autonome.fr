import { mockSkills } from '../data/mockData'

export function CompetencesPage() {
  return (
    <div className="stack-lg">
      <header className="page-header">
        <h1>Banque de compétences</h1>
        <p className="muted">
          Modèle d’annonces pour une économie du faire ensemble — pas de paiement,
          uniquement des accords réciproques à formaliser hors ligne.
        </p>
      </header>

      <ul className="listing-grid">
        {mockSkills.map((s) => (
          <li key={s.id} className="card listing-card">
            <div className="listing-top">
              <span className="pill pill--skills">Temps & savoir-faire</span>
              <span className="muted small">{s.zoneLabel}</span>
            </div>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
