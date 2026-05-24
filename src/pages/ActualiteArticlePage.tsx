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
        <p className="eyebrow">{article.category}</p>
        <h1>{article.title}</h1>
        <p className="lede">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          {' · '}
          Réseau Autonomie &amp; Solidarité
        </p>
      </header>

      <article className="card news-item">
        <ArticleBody contentHtml={article.contentHtml} />
        <div className="news-item__actions">
          {article.facebookUrl ? (
            <a
              className="btn btn-ghost btn-sm"
              href={article.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir sur Facebook
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
