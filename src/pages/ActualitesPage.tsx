import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

type NewsItem = {
  id: string
  date: string
  tag: string
  title: string
  body: string
  image?: string
  link?: { href: string; label: string; external?: boolean }
  facebookLink?: { href: string; label: string; external?: boolean }
}

const newsItems: NewsItem[] = [
  
  
  
  
  {
    id: 'le-climatiseur-camerounais-qui-rafraichit-autrement',
    date: '2026-05-26',
    tag: 'Communauté',
    title: 'Le climatiseur camerounais qui rafraîchit autrement',
    body:
      'Le climatiseur camerounais qui rafraîchit autrement Au Cameroun, Didier Dinamou veut répondre à un problème très concret : comment rafraîchir une pièce dans des zones où la chaleur est intense, où...',
    link: { href: '/actualites/le-climatiseur-camerounais-qui-rafraichit-autrement', label: 'Lire l\'article' },
    facebookLink: {
      href: 'https://www.facebook.com/share/p/1ChWszhR3S/',
      label: 'Voir sur Facebook',
      external: true,
    },
  },

  {
    id: 'penuries-on-fait-le-point-ensemble-sans-panique-mais-avec-lucidite',
    date: '2026-05-25',
    tag: 'Communauté',
    title: 'Pénuries : on fait le point ensemble',
    body:
      'Carburant, énergie, courses : un tour d’horizon sans alarmisme, avec des réflexes concrets pour s’organiser entre voisins.',
    link: { href: '/actualites/penuries-on-fait-le-point-ensemble-sans-panique-mais-avec-lucidite', label: 'Lire l\'article' },
    facebookLink: {
      href: 'https://www.facebook.com/share/p/1K4ADgcmFd/',
      label: 'Voir sur Facebook',
      external: true,
    },
  },

  {
    id: 'groupe-facebook',
    date: '2026-04-15',
    tag: 'Communauté',
    title: 'Le groupe Facebook du réseau',
    body:
      'C’est là que beaucoup d’échanges commencent : appels à l’aide, retours terrain, liens vers les outils du réseau. Rejoignez-nous si ce n’est pas déjà fait.',
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
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="news-item__cover"
                loading="lazy"
                style={{ width: '100%', maxHeight: '14rem', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }}
              />
            ) : null}
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
