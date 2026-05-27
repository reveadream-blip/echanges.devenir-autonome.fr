import fs from 'node:fs'
import path from 'node:path'
import { canonicalUrl, getPrerenderRoutes, type SeoConfig } from '../src/seo/config'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text)
}

export function applySeoToHtml(template: string, route: SeoConfig): string {
  const canonical = canonicalUrl(route.path)
  const robots = route.robots ?? 'index, follow, max-image-preview:large'

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtmlAttr(route.description)}" />`,
  )
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/,
    `<meta name="robots" content="${escapeHtmlAttr(robots)}" />`,
  )

  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />`,
    )
  } else {
    html = html.replace(
      '</head>',
      `    <link rel="canonical" href="${escapeHtmlAttr(canonical)}" />\n  </head>`,
    )
  }

  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtmlAttr(route.title)}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtmlAttr(route.description)}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtmlAttr(canonical)}" />`,
  )
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtmlAttr(route.title)}" />`,
  )
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtmlAttr(route.description)}" />`,
  )
  html = html.replace(
    /<link\s+rel="alternate"\s+hreflang="fr"\s+href="[^"]*"\s*\/?>/,
    `<link rel="alternate" hreflang="fr" href="${escapeHtmlAttr(canonical)}" />`,
  )

  if (html.includes('name="author"')) {
    html = html.replace(
      /<meta\s+name="author"\s+content="[^"]*"\s*\/?>/,
      '<meta name="author" content="Réseau Autonomie &amp; Solidarité" />',
    )
  } else {
    html = html.replace(
      '</head>',
      '    <meta name="author" content="Réseau Autonomie &amp; Solidarité" />\n  </head>',
    )
  }

  const h1 = `<h1 class="static-page-heading visually-hidden">${escapeHtml(route.h1)}</h1>`
  if (html.includes('class="static-page-heading')) {
    html = html.replace(/<h1 class="static-page-heading[^"]*">[\s\S]*?<\/h1>\s*/g, `${h1}\n    `)
  } else {
    html = html.replace('<div id="root"></div>', `${h1}\n    <div id="root"></div>`)
  }

  return html
}

export function prerenderSeoHtml(distDir: string): void {
  const templatePath = path.join(distDir, 'index.html')
  if (!fs.existsSync(templatePath)) {
    console.warn('[prerender-seo] dist/index.html introuvable — ignoré')
    return
  }

  const template = fs.readFileSync(templatePath, 'utf8')
  const routes = getPrerenderRoutes()

  for (const route of routes) {
    const html = applySeoToHtml(template, route)
    const outPath =
      route.path === '/'
        ? templatePath
        : path.join(distDir, route.path.slice(1), 'index.html')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, html, 'utf8')
  }

  console.log(`[prerender-seo] ${routes.length} pages HTML générées`)
}
