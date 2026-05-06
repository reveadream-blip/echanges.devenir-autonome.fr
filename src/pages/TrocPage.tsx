import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, mockListings } from '../data/mockData'
import type { FoodCategory } from '../types'

const ALL = 'tous' as const

export function TrocPage() {
  const [filter, setFilter] = useState<FoodCategory | typeof ALL>(ALL)

  const listings = useMemo(() => {
    if (filter === ALL) return mockListings
    return mockListings.filter((l) => l.category === filter)
  }, [filter])

  const chips: Array<{ id: typeof ALL | FoodCategory; label: string }> = [
    { id: ALL, label: 'Toutes' },
    ...(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
    })),
  ]

  return (
    <div className="stack-lg">
      <header className="page-header">
        <h1>Troc alimentaire</h1>
        <p className="muted">
          Données factices pour valider l’interface. Aucune transaction réelle.
        </p>
      </header>

      <div className="chip-row" role="toolbar" aria-label="Filtrer par catégorie">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className={'chip' + (filter === c.id ? ' chip--active' : '')}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="listing-grid">
        {listings.map((item) => (
          <li key={item.id} className="card listing-card">
            <div className="listing-top">
              <span className="pill">{CATEGORY_LABELS[item.category]}</span>
              <span className="muted small">{item.zoneLabel}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <p className="exchange">{item.exchangeHint}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
