import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

type NewsItem = {
  id: string
  date: string
  tag: string
  title: string
  body: string
  link?: { href: string; label: string; external?: boolean }
  facebookLink?: { href: string; label: string; external?: boolean }
}

const newsItems: NewsItem[] = [
  {
    id: 'test-pub-1779605360042',
    date: '2026-05-24',
    tag: 'Actualité',
    title: 'Test publication multisite',
    body:
      'Resume test',
    link: {
      href: 'https://devenirautonome.fr/article-test-pub-1779605360042.html',
      label: 'Lire l\'article',
      external: true,
    },
    facebookLink: {
      href: 'https://www.facebook.com/share/p/1K4ADgcmFd/',
      label: 'Voir sur Facebook',
      external: true,
    },
  },

  {
    id: 'penuries-on-fait-le-point-ensemble-sans-panique-mais-avec-lucidite',
    date: '2026-05-24',
    tag: 'Communauté',
    title: 'Pénuries : On fait le point ensemble (sans panique, mais avec lucidité)',
    body:
      'Salut à tous,

Vous avez sûrement suivi les dernières annonces de Macron et les infos qui tournent en boucle sur les risques...',
    link: {
      href: 'https://devenirautonome.fr/article-penuries-on-fait-le-point-ensemble-sans-panique-mais-avec-lucidite.html',
      label: 'Lire l\'article',
      external: true,
    },
    facebookLink: {
      href: 'https://www.facebook.com/share/p/1K4ADgcmFd/',
      label: 'Voir sur Facebook',
      external: true,
    },
  },

  {
    id: 'cat-oeuf-volaille',
    date: '2026-05-22',
    tag: 'Plateforme',
    title: 'Catégorie Oeuf / Volaille sur le troc alimentaire',
    body:
      'Les annonces d’œufs fermiers, volailles et produits associés ont désormais leur filtre dédié dans la rubrique Troc et résilience.',
    link: { href: '/troc', label: 'Voir les annonces troc' },
  },
  {
    id: 'messagerie',
    date: '2026-05-01',
    tag: 'Fonctionnalité',
    title: 'Messagerie entre participants',
    body:
      'Échangez en privé à partir d’une annonce pour convenir du rendez-vous, sans publier d’adresse précise sur la fiche publique.',
    link: { href: '/connexion', label: 'Se connecter' },
  },
  {
    id: 'groupe-facebook',
    date: '2026-04-15',
    tag: 'Communauté',
    title: 'Groupe Facebook « réseau autonomie »',
    body:
      'Discussions, appels à l’entraide et coordination locale : rejoignez le groupe pour suivre l’actualité du réseau au quotidien.',
    link: {
      href: 'https://www.facebook.com/groups/reseauautonomie',
      label: 'Rejoindre le groupe',
      external: true,
    },
  },
]

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ActualitesPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const res = await apiPostJson<{ ok: true }>('/api/newsletter/subscribe', { email })

    if (!res.ok) {
      setStatus('error')
      setMessage(res.message)
      return
    }

    setStatus('ok')
    setMessage('Inscription enregistrée. Merci pour votre engagement local.')
    setEmail('')
  }

  return (
    <div className="stack-lg news-page">
      <header className="page-header">
        <p className="eyebrow">Communauté</p>
        <h1>Actualités</h1>
        <p className="lede">
          Nouveautés de la plateforme, points de coordination et liens utiles pour
          suivre l’entraide locale.
        </p>
      </header>

      <ol className="news-list">
        {newsItems.map((item) => (
          <li key={item.id} className="card news-item">
            <div className="news-item__meta">
              <time className="news-item__date" dateTime={item.date}>
                {formatDate(item.date)}
              </time>
              <span className="pill">{item.tag}</span>
              {item.facebookLink ? (
                <span className="news-item__source">Réseau Autonomie &amp; Solidarité</span>
              ) : null}
            </div>
            <h2 className="news-item__title">{item.title}</h2>
            <p className="muted">{item.body}</p>
            {(item.link || item.facebookLink) ? (
              <div className="news-item__actions">
                {item.link ? (
                  item.link.external ? (
                    <a
                      className="btn btn-primary btn-sm"
                      href={item.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.link.label}
                    </a>
                  ) : (
                    <Link className="btn btn-primary btn-sm" to={item.link.href}>
                      {item.link.label}
                    </Link>
                  )
                ) : null}
                {item.facebookLink ? (
                  <a
                    className="btn btn-ghost btn-sm"
                    href={item.facebookLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.facebookLink.label}
                  </a>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      <section className="card community-cta">
        <p className="eyebrow">Ne rien manquer</p>
        <h2>Recevoir les prochaines actualités par email</h2>
        <p className="muted small">
          Alertes utiles, nouvelles fonctions et rappels de coordination — sans spam.
        </p>
        <form className="newsletter-form" onSubmit={onNewsletterSubmit}>
          <input
            className="form-input"
            type="email"
            placeholder="Votre email"
            aria-label="Email newsletter"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Envoi…' : 'S’abonner'}
          </button>
        </form>
        {message ? (
          <p className={`small ${status === 'error' ? 'muted' : ''}`}>{message}</p>
        ) : null}
      </section>

      <p className="small muted">
        Écosystème plus large :{' '}
        <a href="https://devenirautonome.fr/" target="_blank" rel="noreferrer">
          devenirautonome.fr
        </a>
        {' · '}
        <Link to="/informations">Infos &amp; cadre</Link>
      </p>
    </div>
  )
}
