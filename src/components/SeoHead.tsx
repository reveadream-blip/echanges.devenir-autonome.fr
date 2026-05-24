import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_BASE =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://echanges.devenirautonome.fr'

const DEFAULT_TITLE = 'Troc & Savoir-Faire — Entraide locale'
const DEFAULT_DESCRIPTION =
  'Plateforme d’entraide locale : troc alimentaire, banque de compétences utiles et carte de proximité avec zone géographique respectueuse.'

type SeoConfig = {
  title: string
  description: string
  robots?: string
}

function seoForPath(pathname: string): SeoConfig {
  const p = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname

  if (p.startsWith('/admin')) {
    return {
      title: `Administration — ${DEFAULT_TITLE}`,
      description: DEFAULT_DESCRIPTION,
      robots: 'noindex, nofollow',
    }
  }

  if (p.startsWith('/messages')) {
    return {
      title: `Messagerie — ${DEFAULT_TITLE}`,
      description: DEFAULT_DESCRIPTION,
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
    return {
      title:
        p === '/connexion'
          ? `Connexion — ${DEFAULT_TITLE}`
          : p === '/inscription'
            ? `Créer un compte — ${DEFAULT_TITLE}`
            : `Compte — ${DEFAULT_TITLE}`,
      description: DEFAULT_DESCRIPTION,
      robots: 'noindex, nofollow',
    }
  }

  const parts = p.split('/').filter(Boolean)

  if (parts[0] === 'troc' && parts.length === 2 && parts[1] !== 'nouveau') {
    const id = parts[1]
    if (id !== 'modifier' && !id.includes('/')) {
      return {
        title: `Annonce troc alimentaire — ${DEFAULT_TITLE}`,
        description:
          'Détail d’une annonce de troc alimentaire locale : échange, lieu approximatif et contact sécurisé.',
      }
    }
  }

  if (parts[0] === 'competences' && parts.length === 2 && parts[1] !== 'nouveau') {
    const id = parts[1]
    if (id !== 'modifier' && !id.includes('/')) {
      return {
        title: `Savoir-faire — ${DEFAULT_TITLE}`,
        description:
          'Fiche d’offre ou demande de compétence locale : échange de savoir-faire et coordination de proximité.',
      }
    }
  }

  switch (p) {
    case '/':
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      }
    case '/troc':
      return {
        title: `Troc alimentaire — ${DEFAULT_TITLE}`,
        description:
          'Annonces de troc alimentaire près de chez vous : frais, secs, conserves, semences et échanges utiles.',
      }
    case '/competences':
      return {
        title: `Banque de savoir-faire — ${DEFAULT_TITLE}`,
        description:
          'Échangez des compétences utiles : potager, réparation, conservation, logistique et entraide terrain.',
      }
    case '/carte':
      return {
        title: `Carte de proximité — ${DEFAULT_TITLE}`,
        description:
          'Visualisez les annonces autour de vous avec une zone géographique floutée pour protéger chacun.',
      }
    case '/informations':
      return {
        title: `Informations et cadre — ${DEFAULT_TITLE}`,
        description:
          'Cadre du projet, confidentialité et bonnes pratiques pour utiliser la plateforme en confiance.',
      }
    case '/actualites':
      return {
        title: `Actualités — ${DEFAULT_TITLE}`,
        description:
          'Nouveautés de la plateforme, coordination locale et liens utiles pour suivre l’entraide du réseau.',
      }
    case '/soutenir':
      return {
        title: `Soutenir le réseau — ${DEFAULT_TITLE}`,
        description:
          'Soutenez le réseau par un don ou un partenariat pour maintenir une plateforme d’entraide locale.',
      }
    default:
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      }
  }
}

function setMeta(attrName: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attrName: 'name' | 'property', key: string) {
  document.querySelector(`meta[${attrName}="${key}"]`)?.remove()
}

export function SeoHead() {
  const { pathname } = useLocation()

  useEffect(() => {
    const cfg = seoForPath(pathname)
    const canonicalUrl =
      pathname === '/' ? `${SITE_BASE}/` : `${SITE_BASE}${pathname.split('?')[0]}`

    document.title = cfg.title

    setMeta('name', 'description', cfg.description)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalUrl)

    if (cfg.robots) {
      setMeta('name', 'robots', cfg.robots)
    } else {
      removeMeta('name', 'robots')
    }

    const ogImage = `${SITE_BASE}/pwa-512.png`
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Troc & Savoir-Faire')
    setMeta('property', 'og:title', cfg.title)
    setMeta('property', 'og:description', cfg.description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:image:width', '512')
    setMeta('property', 'og:image:height', '512')
    setMeta('property', 'og:locale', 'fr_FR')

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', cfg.title)
    setMeta('name', 'twitter:description', cfg.description)
    setMeta('name', 'twitter:image', ogImage)

    let hreflang = document.querySelector('link[rel="alternate"][hreflang="fr"]')
    if (!hreflang) {
      hreflang = document.createElement('link')
      hreflang.setAttribute('rel', 'alternate')
      hreflang.setAttribute('hreflang', 'fr')
      document.head.appendChild(hreflang)
    }
    hreflang.setAttribute('href', canonicalUrl)
  }, [pathname])

  return null
}
