import { Link, useParams } from 'react-router-dom'
import { NETWORK_ARTICLES } from '../data/networkArticles'

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ArticleBody({ contentHtml }: { contentHtml: string }) {
  if (contentHtml.includes('<p>') || contentHtml.includes('<br')) {
    return (
      <div
        className="article-body muted"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    )
  }

  return (
    <div className="article-body">
      {contentHtml.split(/\n\s*\n/).map((block, i) => (
        <p key={i} className="muted" style={{ whiteSpace: 'pre-wrap' }}>
          {block.trim()}
        </p>
      ))}
    </div>
  )
}

export function ActualiteArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()
  const article = NETWORK_ARTICLES.find((a) => a.id === articleId)

  if (!article) {
    return (
      <div className="stack-lg">
        <p className="muted">Article introuvable.</p>
        <Link to="/actualites" className="btn btn-primary btn-sm">Retour aux actualités</Link>
      </div>
    )
  }

  return (
    <div className="stack-lg news-page">
      <header className="page-header">
        <div className="news-item__meta" style={{ marginBottom: '0.75rem' }}>
          <span className="pill">{article.category}</span>
          <span className="pill">Résilience</span>
          {article.facebookUrl ? (
            <span className="news-item__source">Réseau Autonomie &amp; Solidarité</span>
          ) : null}
        </div>
        <h1>{article.title}</h1>
        {article.facebookUrl ? (
          <p className="lede small muted">
            Publié sur le groupe Facebook <em>Réseau Autonomie &amp; Solidarité — Troc, Savoir-Faire, Anti-Gaspi &amp; Résilience</em>
          </p>
        ) : (
          <p className="lede">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            {' · '}
            Réseau Autonomie &amp; Solidarité
          </p>
        )}
      </header>

      <article className="card news-item">
        <ArticleBody contentHtml={article.contentHtml} />
        <aside className="card" style={{ marginTop: '2rem', padding: '1.25rem' }}>
          <p className="eyebrow">Ressources du réseau</p>
          <ul className="small muted" style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
            <li><a href="https://devenirautonome.fr" target="_blank" rel="noreferrer">DevenirAutonome.fr</a> — protocoles autonomie</li>
            <li><a href="https://echanges.devenirautonome.fr" target="_blank" rel="noreferrer">Troc &amp; Savoir-Faire</a> — troc de proximité</li>
            <li><a href="https://ecoconso-comparatif.fr" target="_blank" rel="noreferrer">EcoConso-Comparatif</a> — solaire et énergie</li>
            <li><a href="https://freshrescue.app" target="_blank" rel="noreferrer">FreshRescue</a> — anti-gaspi</li>
          </ul>
        </aside>
        <div className="news-item__actions">
          {article.facebookUrl ? (
            <a
              className="btn btn-ghost btn-sm"
              href={article.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir la publication originale
            </a>
          ) : null}
          <Link className="btn btn-primary btn-sm" to="/actualites">
            ← Toutes les actualités
          </Link>
        </div>
      </article>
    </div>
  )
}
