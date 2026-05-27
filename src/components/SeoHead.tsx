import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { canonicalUrl, seoForPath, SITE_BASE as DEFAULT_SITE_BASE } from '../seo/config'

const SITE_BASE =
  import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? DEFAULT_SITE_BASE

function setMeta(attrName: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function SeoHead() {
  const { pathname } = useLocation()

  useEffect(() => {
    const cfg = seoForPath(pathname)
    const canonical = canonicalUrl(cfg.path)

    document.title = cfg.title

    setMeta('name', 'description', cfg.description)

    let canonicalEl = document.querySelector('link[rel="canonical"]')
    if (!canonicalEl) {
      canonicalEl = document.createElement('link')
      canonicalEl.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalEl)
    }
    canonicalEl.setAttribute('href', canonical)

    if (cfg.robots) {
      setMeta('name', 'robots', cfg.robots)
    } else {
      setMeta('name', 'robots', 'index, follow, max-image-preview:large')
    }

    const ogImage = `${SITE_BASE}/pwa-512.png`
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Troc & Savoir-Faire')
    setMeta('property', 'og:title', cfg.title)
    setMeta('property', 'og:description', cfg.description)
    setMeta('property', 'og:url', canonical)
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
    hreflang.setAttribute('href', canonical)
  }, [pathname])

  return null
}
