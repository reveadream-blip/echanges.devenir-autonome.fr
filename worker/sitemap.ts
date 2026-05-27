import type { Env } from './app'
import { NETWORK_ARTICLES } from '../src/data/networkArticles'

const DEFAULT_BASE = 'https://echanges.devenirautonome.fr'

type StaticEntry = { path: string; changefreq: string; priority: string }

const STATIC_URLS: StaticEntry[] = [
  { path: '/', changefreq: 'weekly', priority: '1' },
  { path: '/troc', changefreq: 'daily', priority: '0.95' },
  { path: '/competences', changefreq: 'daily', priority: '0.95' },
  { path: '/carte', changefreq: 'weekly', priority: '0.85' },
  { path: '/informations', changefreq: 'monthly', priority: '0.75' },
  { path: '/actualites', changefreq: 'weekly', priority: '0.8' },
  { path: '/soutenir', changefreq: 'monthly', priority: '0.8' },
]

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatLastmod(tsSec: number): string {
  return new Date(tsSec * 1000).toISOString().slice(0, 10)
}

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}

function buildStaticUrls(base: string): string[] {
  const lines: string[] = []
  for (const s of STATIC_URLS) {
    const loc = s.path === '/' ? `${base}/` : `${base}${s.path}`
    lines.push('  <url>')
    lines.push(`    <loc>${escapeXml(loc)}</loc>`)
    lines.push(`    <changefreq>${s.changefreq}</changefreq>`)
    lines.push(`    <priority>${s.priority}</priority>`)
    lines.push('  </url>')
  }
  return lines
}

function buildNewsArticleUrls(base: string): string[] {
  const lines: string[] = []
  for (const article of NETWORK_ARTICLES) {
    const loc = `${base}/actualites/${article.id}`
    lines.push('  <url>')
    lines.push(`    <loc>${escapeXml(loc)}</loc>`)
    if (article.date) {
      lines.push(`    <lastmod>${escapeXml(article.date)}</lastmod>`)
    }
    lines.push('    <changefreq>monthly</changefreq>')
    lines.push('    <priority>0.7</priority>')
    lines.push('  </url>')
  }
  return lines
}

export async function sitemapXmlResponse(env: Env): Promise<Response> {
  const base = (env.PUBLIC_SITE_URL ?? DEFAULT_BASE).replace(/\/$/, '')

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...buildStaticUrls(base),
    ...buildNewsArticleUrls(base),
  ]

  try {
    const db = env.DB
    if (!db) throw new Error('D1 non liée')

    const food = await db
      .prepare('SELECT id, created_at FROM food_listings ORDER BY created_at DESC')
      .all<{ id: string; created_at: number }>()

    for (const row of food.results ?? []) {
      const loc = `${base}/troc/${row.id}`
      lines.push('  <url>')
      lines.push(`    <loc>${escapeXml(loc)}</loc>`)
      lines.push(`    <lastmod>${formatLastmod(row.created_at)}</lastmod>`)
      lines.push('    <changefreq>weekly</changefreq>')
      lines.push('    <priority>0.65</priority>')
      lines.push('  </url>')
    }

    const skills = await db
      .prepare('SELECT id, created_at FROM skill_listings ORDER BY created_at DESC')
      .all<{ id: string; created_at: number }>()

    for (const row of skills.results ?? []) {
      const loc = `${base}/competences/${row.id}`
      lines.push('  <url>')
      lines.push(`    <loc>${escapeXml(loc)}</loc>`)
      lines.push(`    <lastmod>${formatLastmod(row.created_at)}</lastmod>`)
      lines.push('    <changefreq>weekly</changefreq>')
      lines.push('    <priority>0.65</priority>')
      lines.push('  </url>')
    }
  } catch (e) {
    console.error('[sitemap] D1 — liste URLs dynamiques ignorée', e)
  }

  lines.push('</urlset>')

  return xmlResponse(lines.join('\n'))
}
