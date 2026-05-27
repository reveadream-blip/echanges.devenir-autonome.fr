import { NETWORK_ARTICLES } from '../data/networkArticles'

export const SITE_BASE = 'https://echanges.devenirautonome.fr'

export const DEFAULT_TITLE = 'Troc & Savoir-Faire — Entraide locale'
export const DEFAULT_DESCRIPTION =
  'Plateforme d’entraide locale : troc alimentaire, banque de compétences utiles et carte de proximité avec zone géographique respectueuse.'

export type SeoConfig = {
  path: string
  title: string
  description: string
  h1: string
  robots?: string
}

function normalizePath(pathname: string): string {
  if (pathname.endsWith('/') && pathname !== '/') {
    return pathname.slice(0, -1)
  }
  return pathname
}

function excerptToDescription(excerpt: string, max = 160): string {
  const flat = excerpt.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, max - 1).trim()}…`
}

export function canonicalUrl(path: string): string {
  const p = normalizePath(path)
  return p === '/' ? `${SITE_BASE}/` : `${SITE_BASE}${p}`
}

export function seoForPath(pathname: string): SeoConfig {
  const p = normalizePath(pathname)

  if (p.startsWith('/admin')) {
    return {
      path: p,
      title: `Administration — ${DEFAULT_TITLE}`,
      description: DEFAULT_DESCRIPTION,
      h1: 'Administration',
      robots: 'noindex, nofollow',
    }
  }

  if (p.startsWith('/messages')) {
    return {
      path: p,
      title: `Messagerie — ${DEFAULT_TITLE}`,
      description: DEFAULT_DESCRIPTION,
      h1: 'Messagerie',
      robots: 'noindex, nofollow',
    }
  }

  if (
    p === '/connexion' ||
    p === '/inscription' ||
    p === '/confirmer-email' ||
    p === '/mot-de-passe-oublie' ||
    p === '/reinitialiser-mot-de-passe'
  ) {
    const h1 =
      p === '/connexion'
        ? 'Connexion'
        : p === '/inscription'
          ? 'Créer un compte'
          : 'Compte'
    return {
      path: p,
      title:
        p === '/connexion'
          ? `Connexion — ${DEFAULT_TITLE}`
          : p === '/inscription'
            ? `Créer un compte — ${DEFAULT_TITLE}`
            : `Compte — ${DEFAULT_TITLE}`,
      description: DEFAULT_DESCRIPTION,
      h1,
      robots: 'noindex, nofollow',
    }
  }

  const parts = p.split('/').filter(Boolean)

  if (parts[0] === 'troc' && parts.length === 2 && parts[1] !== 'nouveau' && parts[1] !== 'modifier') {
    return {
      path: p,
      title: `Annonce troc alimentaire — ${DEFAULT_TITLE}`,
      description:
        'Détail d’une annonce de troc alimentaire locale : échange, lieu approximatif et contact sécurisé.',
      h1: 'Annonce troc alimentaire',
    }
  }

  if (
    parts[0] === 'competences' &&
    parts.length === 2 &&
    parts[1] !== 'nouveau' &&
    parts[1] !== 'modifier'
  ) {
    return {
      path: p,
      title: `Savoir-faire — ${DEFAULT_TITLE}`,
      description:
        'Fiche d’offre ou demande de compétence locale : échange de savoir-faire et coordination de proximité.',
      h1: 'Savoir-faire',
    }
  }

  if (parts[0] === 'actualites' && parts.length === 2) {
    const article = NETWORK_ARTICLES.find((a) => a.id === parts[1])
    if (article) {
      const plainTitle = article.title.replace(/^[^\p{L}\p{N}]+/u, '').trim() || article.title
      return {
        path: p,
        title: `${plainTitle} — ${DEFAULT_TITLE}`,
        description: excerptToDescription(article.excerpt),
        h1: plainTitle,
      }
    }
  }

  switch (p) {
    case '/':
      return {
        path: '/',
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        h1: 'Échange de bons procédés, services et troc',
      }
    case '/troc':
      return {
        path: p,
        title: `Troc alimentaire — ${DEFAULT_TITLE}`,
        description:
          'Annonces de troc alimentaire près de chez vous : frais, secs, conserves, semences et échanges utiles.',
        h1: 'Troc et résilience',
      }
    case '/competences':
      return {
        path: p,
        title: `Banque de savoir-faire — ${DEFAULT_TITLE}`,
        description:
          'Échangez des compétences utiles : potager, réparation, conservation, logistique et entraide terrain.',
        h1: 'Échange de bons procédés',
      }
    case '/carte':
      return {
        path: p,
        title: `Carte de proximité — ${DEFAULT_TITLE}`,
        description:
          'Visualisez les annonces autour de vous avec une zone géographique floutée pour protéger chacun.',
        h1: 'Vue de proximité',
      }
    case '/informations':
      return {
        path: p,
        title: `Informations et cadre — ${DEFAULT_TITLE}`,
        description:
          'Cadre du projet, confidentialité et bonnes pratiques pour utiliser la plateforme en confiance.',
        h1: 'Informations, juridique et confidentialité',
      }
    case '/actualites':
      return {
        path: p,
        title: `Actualités — ${DEFAULT_TITLE}`,
        description:
          'Nouveautés de la plateforme, coordination locale et liens utiles pour suivre l’entraide du réseau.',
        h1: 'Actualités',
      }
    case '/soutenir':
      return {
        path: p,
        title: `Soutenir le réseau — ${DEFAULT_TITLE}`,
        description:
          'Soutenez le réseau par un don ou un partenariat pour maintenir une plateforme d’entraide locale.',
        h1: 'Bâtir la résilience ensemble',
      }
    default:
      return {
        path: p,
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        h1: 'Troc & Savoir-Faire',
      }
  }
}

/** Routes publiques à prérendre pour le SEO (HTML initial avec canonical + h1). */
export function getPrerenderRoutes(): SeoConfig[] {
  const staticPaths = [
    '/',
    '/troc',
    '/competences',
    '/carte',
    '/informations',
    '/actualites',
    '/soutenir',
  ]
  const routes = staticPaths.map((path) => seoForPath(path))
  for (const article of NETWORK_ARTICLES) {
    routes.push(seoForPath(`/actualites/${article.id}`))
  }
  return routes
}
