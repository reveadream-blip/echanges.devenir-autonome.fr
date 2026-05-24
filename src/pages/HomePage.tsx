import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function HomePage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [installNote, setInstallNote] = useState<string | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const detectInstalled = () => {
      const nav = window.navigator as Navigator & { standalone?: boolean }
      setIsInstalled(displayMode.matches || nav.standalone === true)
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setInstallNote(null)
    }

    function onAppInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
      setInstallNote('Application installée. Vous la trouverez sur votre écran d’accueil.')
    }

    detectInstalled()
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    displayMode.addEventListener('change', detectInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      displayMode.removeEventListener('change', detectInstalled)
    }
  }, [])

  async function installApp() {
    if (!installPrompt) {
      setInstallNote(
        'Installation non proposée sur ce navigateur. Utilisez le menu navigateur puis “Ajouter à l’écran d’accueil”.',
      )
      return
    }
    setInstalling(true)
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstalling(false)
    if (choice.outcome === 'accepted') {
      setInstallNote('Installation en cours...')
      setInstallPrompt(null)
      return
    }
    setInstallNote('Installation annulée.')
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const res = await apiPostJson<{ ok: true }>('/api/newsletter/subscribe', {
      email,
    })

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
    <div className="stack-lg">
      {!isInstalled ? (
        <section className="card install-cta">
          <div className="install-cta__text">
            <p className="eyebrow">Application mobile</p>
            <h2>Installer Troc & Savoir-Faire sur votre téléphone</h2>
            <p className="small muted">
              Créez un raccourci d’écran d’accueil pour un accès direct, même quand le réseau est
              instable.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void installApp()}
            disabled={installing}
          >
            {installing ? 'Installation…' : 'Installer l’application'}
          </button>
          {installNote ? <p className="small muted">{installNote}</p> : null}
        </section>
      ) : null}

      <section className="hero-panel home-hero">
        <div className="hero-photo" aria-hidden="true" />
        <p className="eyebrow">Résilience locale</p>
        <h1>
          Échange de bons procédés, services et troc.
          <span className="hero-highlight"> S’entraider localement.</span>
        </h1>
        <p className="lede">
          Le système est fragile. Cette plateforme transforme vos ressources
          locales en réseau d’action : troc alimentaire, savoir-faire terrain et
          proximité utile en cas de rupture.
        </p>
        <p className="home-hero-free small muted">
          L’application est <strong>totalement gratuite</strong> : annonces, messagerie et carte
          sans frais. Si vous le souhaitez, vous pouvez{' '}
          <Link className="text-link" to="/soutenir">
            soutenir le projet et la maintenance
          </Link>{' '}
          par un don — cela reste volontaire.
        </p>
        <p className="home-hero-free small muted">
          Une partie des dons et du soutien des <strong>organismes</strong>, des{' '}
          <strong>entreprises</strong> et des <strong>indépendants</strong> servira aussi à aider la
          communauté en cas de besoin.
        </p>
        <div className="hero-pill-row" aria-label="Bénéfices principaux">
          <span className="hero-pill">Coordination locale</span>
          <span className="hero-pill">Messagerie sécurisée</span>
          <span className="hero-pill">Zone géographique floutée</span>
        </div>
        <div className="hero-metrics" aria-label="Repères rapides">
          <article className="hero-metric">
            <strong>24/7</strong>
            <span>Accès mobile</span>
          </article>
          <article className="hero-metric">
            <strong>2 pôles</strong>
            <span>Troc + compétences</span>
          </article>
          <article className="hero-metric">
            <strong>100%</strong>
            <span>Communauté locale</span>
          </article>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/troc">
            Voir les échanges
          </Link>
          <Link className="btn btn-ghost" to="/competences">
            Échanger vos savoir-faire
          </Link>
          <Link className="btn btn-ghost" to="/carte">
            Ouvrir la carte
          </Link>
        </div>
      </section>

      <aside className="home-support-nudge" aria-label="Soutenir le réseau">
        <Link to="/soutenir" className="home-support-nudge__link">
          <span className="home-support-nudge__label">Soutenir le réseau</span>
          <span className="home-support-nudge__hint">
            <span className="home-support-nudge__hint-dons">Dons</span>
            <span className="home-support-nudge__hint-sep"> · </span>
            <span className="home-support-nudge__hint-part">partenariat</span>
          </span>
          <span className="home-support-nudge__cta">Découvrir</span>
        </Link>
      </aside>

      <section className="landing-sections">
        <article className="card section-block">
          <div
            className="section-photo"
            style={{ backgroundImage: "url('/photos/section-01.jpg')" }}
          />
          <p className="section-kicker">01</p>
          <h2>Activer le troc alimentaire</h2>
          <p className="muted">
            Frais, sec, conserves, semences : échange direct ou points de
            résilience. Les annonces sont conçues pour aller vite, sans friction.
          </p>
          <Link className="text-link" to="/troc">
            Voir les annonces →
          </Link>
        </article>

        <article className="card section-block">
          <div
            className="section-photo"
            style={{ backgroundImage: "url('/photos/section-02.jpg')" }}
          />
          <p className="section-kicker">02</p>
          <h2>Échanger des compétences utiles</h2>
          <p className="muted">
            Réparation, potager, conservation, logistique : une banque de temps
            concrète pour répondre aux besoins de terrain.
          </p>
          <Link className="text-link" to="/competences">
            Ouvrir la banque de savoir-faire →
          </Link>
        </article>

        <article className="card section-block">
          <div
            className="section-photo"
            style={{ backgroundImage: "url('/photos/section-03.jpg')" }}
          />
          <p className="section-kicker">03</p>
          <h2>Prioriser la proximité de survie</h2>
          <p className="muted">
            Visualisation locale 5 à 10 km avec zone floutée. Vous protégez vos
            points sensibles tout en gardant une coordination efficace.
          </p>
          <Link className="text-link" to="/carte">
            Consulter la carte →
          </Link>
        </article>

        <article className="card section-block">
          <div
            className="section-photo"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <p className="section-kicker">04</p>
          <h2>Tenir même avec un réseau instable</h2>
          <p className="muted">
            L’application fonctionne en PWA : accès aux dernières pages
            consultées, même si la connectivité devient intermittente.
          </p>
          <Link className="text-link" to="/informations">
            Lire le cadre et la confidentialité →
          </Link>
        </article>
      </section>

      <section className="card community-cta">
        <p className="eyebrow">Rejoignez la résistance autonome</p>
        <h2>Recevez les mises à jour de la communauté</h2>
        <p className="muted">
          Pas de spam. Alertes utiles, nouvelles annonces et points de
          coordination locale.
        </p>
        <form className="newsletter-form" onSubmit={onSubmit}>
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

      <section className="home-partners" aria-label="Partenaires">
        <p className="home-partners__label">Partenaires</p>
        <div className="home-partners__grid">
          <a
            className="home-partner-card"
            href="https://applimanagement.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="home-partner-card__name">applimanagement</span>
            <img
              className="home-partner-card__logo"
              src="https://applimanagement.com/AppliManagement.png"
              alt="AppliManagement — sites vitrines, CRM et applications web"
              loading="lazy"
              decoding="async"
            />
          </a>
          <a
            className="home-partner-card"
            href="https://freshrescue.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="home-partner-card__name">FreshRescue</span>
            <img
              className="home-partner-card__logo"
              src="https://freshrescue.app/logo512.png"
              alt="Logo FreshRescue"
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
      </section>
    </div>
  )
}
