import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { haversineKm, snapLatLng, zoneLabel } from './geo'
import {
  randomUrlToken,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sha256Hex,
} from './mail'
import { hashPassword, verifyPassword } from './password'

export interface Env {
  DB: D1Database
  ASSETS?: Fetcher
  /** https://resend.com — `wrangler secret put RESEND_API_KEY` */
  RESEND_API_KEY?: string
  /** Ex. `Troc et Survie <noreply@votredomaine.fr>` */
  MAIL_FROM?: string
  /** URL publique du site pour les liens dans les e-mails */
  PUBLIC_SITE_URL?: string
  /** `wrangler secret put STRIPE_WEBHOOK_SECRET` — signing secret du endpoint webhook Stripe */
  STRIPE_WEBHOOK_SECRET?: string
}

type AuthUser = {
  id: string
  email: string
  display_name: string
  verified: number
}

type Variables = {
  user: AuthUser | null
}

const SESSION_COOKIE = 'ts_sid'
const SESSION_SEC = 60 * 60 * 24 * 14
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PURPOSE_VERIFY_EMAIL = 'verify_email'
const PURPOSE_RESET_PASSWORD = 'reset_password'
const VERIFY_TOKEN_TTL_SEC = 48 * 3600
const RESET_TOKEN_TTL_SEC = 3600
const FOOD_CATS = [
  'Frais',
  'Sec',
  'Conserves',
  'Semences',
  'Boissons',
  'Épicerie',
  'Hygiène',
  'Viande',
  'Oeuf/Volaille',
  'Poisson',
] as const
const ADMIN_EMAIL = 'contact.applimanagement@gmail.com'

/** Décodée ; aligné sur la compression client (~420 Ko JPEG). */
const LISTING_PHOTO_MAX_BYTES = 480_000
const LISTING_PHOTO_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function validateListingPhoto(raw: unknown): { mime: string; data_base64: string } | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'object') return null
  const o = raw as { mime?: unknown; data_base64?: unknown }
  const mime = o.mime
  const data_base64 = o.data_base64
  if (typeof mime !== 'string' || !LISTING_PHOTO_MIMES.has(mime)) return null
  if (typeof data_base64 !== 'string' || data_base64.length === 0) return null
  if (data_base64.length > Math.ceil(LISTING_PHOTO_MAX_BYTES * 1.37)) return null
  try {
    const bin = atob(data_base64)
    if (bin.length === 0 || bin.length > LISTING_PHOTO_MAX_BYTES) return null
    return { mime, data_base64 }
  } catch {
    return null
  }
}

function photoUrlFromRow(mime: string | null | undefined, data: string | null | undefined): string | null {
  if (!mime || !data) return null
  return `data:${mime};base64,${data}`
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

const CONTACT_PHONE_MAX = 48

function normalizeContactPhone(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (s.length === 0) return null
  if (s.length > CONTACT_PHONE_MAX) return null
  if (!/^[\d\s+.()-]+$/.test(s)) return null
  return s
}

function normalizeContactEmailField(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') return null
  const e = normalizeEmail(raw)
  if (e.length === 0) return null
  if (!EMAIL_RE.test(e)) return null
  return e
}

const MESSAGE_BODY_MAX = 8000

type ListingMessageKind = 'food' | 'skill'

function parseListingMessageKind(raw: unknown): ListingMessageKind | null {
  if (raw === 'food' || raw === 'skill') return raw
  return null
}

function normalizeMessageBody(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (t.length === 0) return null
  if (t.length > MESSAGE_BODY_MAX) return null
  return t
}

function listingDetailPath(kind: ListingMessageKind, listingId: string): string {
  return kind === 'food' ? `/troc/${listingId}` : `/competences/${listingId}`
}

function parseViewer(url: URL): { vl?: number; vg?: number } {
  const vl = Number(url.searchParams.get('viewer_lat'))
  const vg = Number(url.searchParams.get('viewer_lng'))
  if (Number.isFinite(vl) && Number.isFinite(vg)) return { vl, vg }
  return {}
}

function cookieOpts(url: URL) {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax' as const,
    secure: url.protocol === 'https:',
    maxAge: SESSION_SEC,
  }
}

function sitePublicUrl(c: { env: Env; req: { url: string } }): string {
  const v = c.env.PUBLIC_SITE_URL
  if (typeof v === 'string' && v.trim().length > 0) {
    return v.replace(/\/$/, '')
  }
  return new URL(c.req.url).origin
}

function requireAdmin(c: { get: (k: 'user') => AuthUser | null }) {
  const u = c.get('user')
  if (!u) return { ok: false as const, status: 401, message: 'Connexion requise' }
  if (normalizeEmail(u.email) !== ADMIN_EMAIL) {
    return { ok: false as const, status: 403, message: 'Accès administrateur requis' }
  }
  return { ok: true as const, user: u }
}

export function createApi() {
  const api = new Hono<{ Bindings: Env; Variables: Variables }>().basePath('/api')

  const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://echanges.devenirautonome.fr',
    'https://www.echanges.devenirautonome.fr',
    'https://echanges-troc-survie.contact-applimanagement.workers.dev',
  ])

  api.use(
    '*',
    cors({
      origin: (origin) => (origin && allowedOrigins.has(origin) ? origin : null),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      credentials: true,
    }),
  )

  api.use('*', async (c, next) => {
    const sid = getCookie(c, SESSION_COOKIE)
    if (!sid) {
      c.set('user', null)
      await next()
      return
    }
    const now = Math.floor(Date.now() / 1000)
    const row = await c.env.DB.prepare(
      `SELECT u.id, u.email, u.display_name, u.verified
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
      .bind(sid, now)
      .first<AuthUser>()
    c.set('user', row ?? null)
    await next()
  })

  api.onError((err, c) => {
    console.error('[api]', err)
    const msg =
      err instanceof Error && err.message ? err.message : 'Erreur serveur'
    return c.json({ error: msg }, 500)
  })

  api.get('/health', (c) => c.json({ ok: true }))

  api.post('/newsletter/subscribe', async (c) => {
    let body: { email?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const email = normalizeEmail(body.email ?? '')
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: 'Email invalide' }, 400)
    }

    const now = Math.floor(Date.now() / 1000)
    try {
      await c.env.DB.prepare(
        `INSERT INTO newsletter_subscribers (id, email, created_at)
         VALUES (?, ?, ?)`,
      )
        .bind(crypto.randomUUID(), email, now)
        .run()
    } catch {
      // Déjà inscrit (contrainte unique) => réponse idempotente
    }

    return c.json({ ok: true })
  })

  api.post('/partnerships/lead', async (c) => {
    let body: {
      contact_name?: unknown
      organization?: unknown
      email?: unknown
      phone?: unknown
      plan_interest?: unknown
      message?: unknown
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }

    const contactName = typeof body.contact_name === 'string' ? body.contact_name.trim() : ''
    const organization = typeof body.organization === 'string' ? body.organization.trim() : ''
    const email = normalizeEmail(typeof body.email === 'string' ? body.email : '')
    const phoneRaw = typeof body.phone === 'string' ? body.phone : ''
    const planRaw = typeof body.plan_interest === 'string' ? body.plan_interest : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const allowedPlans = new Set(['bronze', 'argent', 'or', 'collectivite'])
    const planInterest = allowedPlans.has(planRaw) ? planRaw : ''
    const phone = normalizeContactPhone(phoneRaw)

    if (contactName.length < 2 || contactName.length > 120) {
      return c.json({ error: 'Nom du contact invalide (2 à 120 caractères).' }, 400)
    }
    if (organization.length < 2 || organization.length > 160) {
      return c.json({ error: 'Nom de structure invalide (2 à 160 caractères).' }, 400)
    }
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: 'E-mail invalide.' }, 400)
    }
    if (phoneRaw.trim() !== '' && !phone) {
      return c.json({ error: 'Téléphone invalide.' }, 400)
    }
    if (!planInterest) {
      return c.json({ error: 'Pack partenaire invalide.' }, 400)
    }
    if (message.length < 10 || message.length > 4000) {
      return c.json({ error: 'Message invalide (10 à 4000 caractères).' }, 400)
    }

    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(
      `INSERT INTO partnership_leads
         (id, contact_name, organization, email, phone, plan_interest, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        contactName,
        organization,
        email,
        phone,
        planInterest,
        message,
        now,
      )
      .run()

    return c.json({ ok: true })
  })

  api.post('/auth/register', async (c) => {
    let body: {
      email?: string
      password?: string
      display_name?: string
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const email = normalizeEmail(body.email ?? '')
    const password = body.password ?? ''
    const display_name = (body.display_name ?? '').trim()
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: 'Email invalide' }, 400)
    }
    if (password.length < 10) {
      return c.json({ error: 'Mot de passe : au moins 10 caractères' }, 400)
    }
    if (display_name.length < 2 || display_name.length > 80) {
      return c.json({ error: 'Pseudo : entre 2 et 80 caractères' }, 400)
    }
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string }>()
    if (existing) return c.json({ error: 'Email déjà utilisé' }, 409)

    const id = crypto.randomUUID()
    const { saltHex, hashHex } = await hashPassword(password)
    const created = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, salt, display_name, verified, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
    )
      .bind(id, email, hashHex, saltHex, display_name, created)
      .run()

    const sid = crypto.randomUUID()
    const exp = Math.floor(Date.now() / 1000) + SESSION_SEC
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(sid, id, exp)
      .run()

    const nowTok = Math.floor(Date.now() / 1000)
    const verifyPlain = randomUrlToken()
    const verifyHash = await sha256Hex(verifyPlain)
    const verifyExp = nowTok + VERIFY_TOKEN_TTL_SEC
    await c.env.DB.prepare(
      `DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?`,
    )
      .bind(id, PURPOSE_VERIFY_EMAIL)
      .run()
    await c.env.DB.prepare(
      `INSERT INTO auth_tokens (id, user_id, token_hash, purpose, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), id, verifyHash, PURPOSE_VERIFY_EMAIL, verifyExp, nowTok)
      .run()

    const mailSent = await sendVerificationEmail(c.env, {
      to: email,
      displayName: display_name,
      token: verifyPlain,
      siteUrl: sitePublicUrl(c),
    })
    if (!mailSent) {
      console.warn('[auth/register] email de confirmation non envoyé', { email })
    }

    const url = new URL(c.req.url)
    setCookie(c, SESSION_COOKIE, sid, cookieOpts(url))
    return c.json({ user: { id, email, display_name, verified: 0 }, mail_sent: mailSent })
  })

  api.post('/auth/verify-email', async (c) => {
    let body: { token?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const token = (body.token ?? '').trim()
    if (token.length < 16) {
      return c.json({ error: 'Lien invalide ou expiré' }, 400)
    }
    const hash = await sha256Hex(token)
    const now = Math.floor(Date.now() / 1000)
    const row = await c.env.DB.prepare(
      `SELECT user_id FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND expires_at > ?`,
    )
      .bind(hash, PURPOSE_VERIFY_EMAIL, now)
      .first<{ user_id: string }>()
    if (!row) return c.json({ error: 'Lien invalide ou expiré' }, 400)

    await c.env.DB.prepare(`UPDATE users SET verified = 1 WHERE id = ?`)
      .bind(row.user_id)
      .run()
    await c.env.DB.prepare(`DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?`)
      .bind(row.user_id, PURPOSE_VERIFY_EMAIL)
      .run()

    return c.json({ ok: true })
  })

  api.post('/auth/resend-verification', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    if (u.verified === 1) return c.json({ error: 'Compte déjà confirmé' }, 400)

    const nowTok = Math.floor(Date.now() / 1000)
    const verifyPlain = randomUrlToken()
    const verifyHash = await sha256Hex(verifyPlain)
    const verifyExp = nowTok + VERIFY_TOKEN_TTL_SEC
    await c.env.DB.prepare(
      `DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?`,
    )
      .bind(u.id, PURPOSE_VERIFY_EMAIL)
      .run()
    await c.env.DB.prepare(
      `INSERT INTO auth_tokens (id, user_id, token_hash, purpose, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        u.id,
        verifyHash,
        PURPOSE_VERIFY_EMAIL,
        verifyExp,
        nowTok,
      )
      .run()

    const sent = await sendVerificationEmail(c.env, {
      to: u.email,
      displayName: u.display_name,
      token: verifyPlain,
      siteUrl: sitePublicUrl(c),
    })
    if (!sent) {
      return c.json(
        {
          error:
            'E-mail non envoyé (configuration e-mail absente ou refusée par le fournisseur).',
        },
        502,
      )
    }

    return c.json({ ok: true })
  })

  api.post('/auth/forgot-password', async (c) => {
    let body: { email?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const email = normalizeEmail(body.email ?? '')
    const generic = { ok: true as const }
    if (!EMAIL_RE.test(email)) return c.json(generic)

    const row = await c.env.DB.prepare(
      `SELECT id, email, display_name FROM users WHERE email = ?`,
    )
      .bind(email)
      .first<{ id: string; email: string; display_name: string }>()
    if (!row) return c.json(generic)

    const nowTok = Math.floor(Date.now() / 1000)
    const resetPlain = randomUrlToken()
    const resetHash = await sha256Hex(resetPlain)
    const resetExp = nowTok + RESET_TOKEN_TTL_SEC
    await c.env.DB.prepare(
      `DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?`,
    )
      .bind(row.id, PURPOSE_RESET_PASSWORD)
      .run()
    await c.env.DB.prepare(
      `INSERT INTO auth_tokens (id, user_id, token_hash, purpose, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        row.id,
        resetHash,
        PURPOSE_RESET_PASSWORD,
        resetExp,
        nowTok,
      )
      .run()

    const sent = await sendPasswordResetEmail(c.env, {
      to: row.email,
      displayName: row.display_name,
      token: resetPlain,
      siteUrl: sitePublicUrl(c),
    })
    if (!sent) {
      return c.json(
        {
          error:
            'E-mail non envoyé (configuration e-mail absente ou refusée par le fournisseur).',
        },
        502,
      )
    }

    return c.json(generic)
  })

  api.post('/auth/reset-password', async (c) => {
    let body: { token?: string; password?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const token = (body.token ?? '').trim()
    const password = body.password ?? ''
    if (token.length < 16) {
      return c.json({ error: 'Lien invalide ou expiré' }, 400)
    }
    if (password.length < 10) {
      return c.json({ error: 'Mot de passe : au moins 10 caractères' }, 400)
    }

    const hash = await sha256Hex(token)
    const now = Math.floor(Date.now() / 1000)
    const row = await c.env.DB.prepare(
      `SELECT user_id FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND expires_at > ?`,
    )
      .bind(hash, PURPOSE_RESET_PASSWORD, now)
      .first<{ user_id: string }>()
    if (!row) return c.json({ error: 'Lien invalide ou expiré' }, 400)

    const { saltHex, hashHex } = await hashPassword(password)
    await c.env.DB.prepare(
      `UPDATE users SET password_hash = ?, salt = ? WHERE id = ?`,
    )
      .bind(hashHex, saltHex, row.user_id)
      .run()
    await c.env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`)
      .bind(row.user_id)
      .run()
    await c.env.DB.prepare(`DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?`)
      .bind(row.user_id, PURPOSE_RESET_PASSWORD)
      .run()

    return c.json({ ok: true })
  })

  api.post('/auth/login', async (c) => {
    let body: { email?: string; password?: string }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const email = normalizeEmail(body.email ?? '')
    const password = body.password ?? ''
    const row = await c.env.DB.prepare(
      'SELECT id, email, display_name, verified, password_hash, salt FROM users WHERE email = ?',
    )
      .bind(email)
      .first<{
        id: string
        email: string
        display_name: string
        verified: number
        password_hash: string
        salt: string
      }>()
    if (!row) return c.json({ error: 'Identifiants incorrects' }, 401)

    const ok = await verifyPassword(password, row.salt, row.password_hash)
    if (!ok) return c.json({ error: 'Identifiants incorrects' }, 401)

    const sid = crypto.randomUUID()
    const exp = Math.floor(Date.now() / 1000) + SESSION_SEC
    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(sid, row.id, exp)
      .run()

    const url = new URL(c.req.url)
    setCookie(c, SESSION_COOKIE, sid, cookieOpts(url))
    return c.json({
      user: {
        id: row.id,
        email: row.email,
        display_name: row.display_name,
        verified: row.verified,
      },
    })
  })

  api.post('/auth/logout', async (c) => {
    const sid = getCookie(c, SESSION_COOKIE)
    if (sid) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run()
    }
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return c.json({ ok: true })
  })

  api.get('/auth/me', (c) => {
    const u = c.get('user')
    if (!u) return c.json({ user: null })
    return c.json({ user: u })
  })

  api.get('/food', async (c) => {
    const url = new URL(c.req.url)
    const { vl, vg } = parseViewer(url)
    const cat = url.searchParams.get('category')

    const sql =
      cat && FOOD_CATS.includes(cat as (typeof FOOD_CATS)[number])
        ? `SELECT f.id, f.category, f.title, f.description, f.exchange, f.resilience_points,
                 f.lat, f.lng, f.created_at, f.photo_mime, f.photo_data, f.user_id,
                 f.contact_phone, f.contact_email,
                 u.display_name AS author_name
           FROM food_listings f
           LEFT JOIN users u ON u.id = f.user_id
           WHERE f.category = ?
           ORDER BY f.created_at DESC`
        : `SELECT f.id, f.category, f.title, f.description, f.exchange, f.resilience_points,
                 f.lat, f.lng, f.created_at, f.photo_mime, f.photo_data, f.user_id,
                 f.contact_phone, f.contact_email,
                 u.display_name AS author_name
           FROM food_listings f
           LEFT JOIN users u ON u.id = f.user_id
           ORDER BY f.created_at DESC`

    const rs =
      cat && FOOD_CATS.includes(cat as (typeof FOOD_CATS)[number])
        ? await c.env.DB.prepare(sql).bind(cat).all()
        : await c.env.DB.prepare(sql).all()

    const rows = rs.results as Array<{
      id: string
      category: string
      title: string
      description: string
      exchange: string
      resilience_points: number | null
      lat: number
      lng: number
      created_at: number
      photo_mime: string | null
      photo_data: string | null
      user_id: string | null
      contact_phone: string | null
      contact_email: string | null
      author_name: string | null
    }>

    const viewerId = c.get('user')?.id ?? null

    return c.json({
      listings: rows.map((r) => {
        const snap = snapLatLng(r.lat, r.lng)
        return {
          id: r.id,
          category: r.category,
          title: r.title,
          description: r.description,
          exchange: r.exchange,
          resilience_points: r.resilience_points,
          approx_lat: snap.lat,
          approx_lng: snap.lng,
          zone_label: zoneLabel(vl, vg, snap.lat, snap.lng),
          author_name: r.author_name ?? 'Participant',
          created_at: r.created_at,
          photo_url: photoUrlFromRow(r.photo_mime, r.photo_data),
          contact_phone: r.contact_phone || null,
          contact_email: r.contact_email || null,
          mine:
            viewerId !== null &&
            r.user_id !== null &&
            r.user_id === viewerId,
        }
      }),
    })
  })

  api.get('/public/food/:id', async (c) => {
    const id = c.req.param('id')
    const url = new URL(c.req.url)
    const { vl, vg } = parseViewer(url)
    const viewerId = c.get('user')?.id ?? null

    const row = await c.env.DB.prepare(
      `SELECT f.id, f.category, f.title, f.description, f.exchange, f.resilience_points,
              f.lat, f.lng, f.created_at, f.photo_mime, f.photo_data,
              f.contact_phone, f.contact_email, f.user_id,
              u.display_name AS author_name
       FROM food_listings f
       LEFT JOIN users u ON u.id = f.user_id
       WHERE f.id = ?`,
    )
      .bind(id)
      .first<{
        id: string
        category: string
        title: string
        description: string
        exchange: string
        resilience_points: number | null
        lat: number
        lng: number
        created_at: number
        photo_mime: string | null
        photo_data: string | null
        contact_phone: string | null
        contact_email: string | null
        user_id: string | null
        author_name: string | null
      }>()
    if (!row) return c.json({ error: 'Annonce introuvable' }, 404)

    const snap = snapLatLng(row.lat, row.lng)
    return c.json({
      listing: {
        id: row.id,
        category: row.category,
        title: row.title,
        description: row.description,
        exchange: row.exchange,
        resilience_points: row.resilience_points,
        approx_lat: snap.lat,
        approx_lng: snap.lng,
        zone_label: zoneLabel(vl, vg, snap.lat, snap.lng),
        author_name: row.author_name ?? 'Participant',
        created_at: row.created_at,
        photo_url: photoUrlFromRow(row.photo_mime, row.photo_data),
        contact_phone: row.contact_phone || null,
        contact_email: row.contact_email || null,
        mine:
          viewerId !== null &&
          row.user_id !== null &&
          row.user_id === viewerId,
      },
    })
  })

  api.get('/food/:id', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const id = c.req.param('id')
    const row = await c.env.DB.prepare(
      `SELECT id, user_id, category, title, description, exchange, resilience_points,
              lat, lng, created_at, photo_mime, photo_data, contact_phone, contact_email
       FROM food_listings WHERE id = ?`,
    )
      .bind(id)
      .first<{
        id: string
        user_id: string | null
        category: string
        title: string
        description: string
        exchange: string
        resilience_points: number | null
        lat: number
        lng: number
        created_at: number
        photo_mime: string | null
        photo_data: string | null
        contact_phone: string | null
        contact_email: string | null
      }>()
    if (!row || row.user_id !== u.id) {
      return c.json({ error: 'Annonce introuvable' }, 404)
    }
    return c.json({
      listing: {
        id: row.id,
        category: row.category,
        title: row.title,
        description: row.description,
        exchange: row.exchange,
        resilience_points: row.resilience_points,
        lat: row.lat,
        lng: row.lng,
        created_at: row.created_at,
        photo_url: photoUrlFromRow(row.photo_mime, row.photo_data),
        contact_phone: row.contact_phone || null,
        contact_email: row.contact_email || null,
      },
    })
  })

  api.post('/food', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)

    let body: {
      category?: string
      title?: string
      description?: string
      exchange?: string
      resilience_points?: number | null
      lat?: number
      lng?: number
      photo?: unknown
      contact_phone?: unknown
      contact_email?: unknown
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }

    let contact_phone: string | null = null
    if (body.contact_phone !== undefined && body.contact_phone !== null) {
      if (typeof body.contact_phone === 'string' && body.contact_phone.trim() !== '') {
        contact_phone = normalizeContactPhone(body.contact_phone)
        if (!contact_phone) {
          return c.json(
            {
              error:
                'Téléphone : uniquement chiffres et + ( ) . - espaces, max 48 caractères.',
            },
            400,
          )
        }
      }
    }

    let contact_email: string | null = null
    if (body.contact_email !== undefined && body.contact_email !== null) {
      if (typeof body.contact_email === 'string' && body.contact_email.trim() !== '') {
        contact_email = normalizeContactEmailField(body.contact_email)
        if (!contact_email) return c.json({ error: 'E-mail de contact invalide.' }, 400)
      }
    }

    let photoMime: string | null = null
    let photoData: string | null = null
    const rawPhoto = body.photo
    if (rawPhoto !== undefined && rawPhoto !== null) {
      const parsed = validateListingPhoto(rawPhoto)
      if (!parsed) {
        return c.json(
          {
            error:
              'Photo invalide ou trop volumineuse (max. ~460 Ko après compression). Formats : JPEG, PNG, WebP.',
          },
          400,
        )
      }
      photoMime = parsed.mime
      photoData = parsed.data_base64
    }

    const category = body.category ?? ''
    if (!FOOD_CATS.includes(category as (typeof FOOD_CATS)[number])) {
      return c.json({ error: 'Catégorie invalide' }, 400)
    }

    const title = (body.title ?? '').trim()
    const description = (body.description ?? '').trim()
    const exchange = (body.exchange ?? '').trim()
    if (title.length < 3 || title.length > 120)
      return c.json({ error: 'Titre : 3 à 120 caractères' }, 400)
    if (description.length < 10 || description.length > 2000)
      return c.json({ error: 'Description : 10 à 2000 caractères' }, 400)
    if (exchange.length < 5 || exchange.length > 2000)
      return c.json({ error: 'Échange : 5 à 2000 caractères' }, 400)

    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return c.json({ error: 'Position invalide' }, 400)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return c.json({ error: 'Coordonnées hors bornes' }, 400)

    let resilience_points: number | null = null
    if (typeof body.resilience_points === 'number') {
      const rp = Math.round(body.resilience_points)
      if (Number.isFinite(rp) && rp >= 0 && rp <= 1_000_000) resilience_points = rp
    }

    const id = crypto.randomUUID()
    const created = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(
      `INSERT INTO food_listings (id, user_id, category, title, description, exchange, resilience_points, lat, lng, created_at, photo_mime, photo_data, contact_phone, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        u.id,
        category,
        title,
        description,
        exchange,
        resilience_points,
        lat,
        lng,
        created,
        photoMime,
        photoData,
        contact_phone,
        contact_email,
      )
      .run()

    const snap = snapLatLng(lat, lng)
    const parsed = parseViewer(new URL(c.req.url))
    return c.json({
      listing: {
        id,
        category,
        title,
        description,
        exchange,
        resilience_points,
        approx_lat: snap.lat,
        approx_lng: snap.lng,
        zone_label: zoneLabel(parsed.vl, parsed.vg, snap.lat, snap.lng),
        author_name: u.display_name,
        created_at: created,
        photo_url: photoUrlFromRow(photoMime, photoData),
        contact_phone,
        contact_email,
      },
    })
  })

  api.patch('/food/:id', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const id = c.req.param('id')

    const row = await c.env.DB.prepare(
      `SELECT user_id, category, title, description, exchange, resilience_points, lat, lng, photo_mime, photo_data, created_at,
              contact_phone, contact_email
       FROM food_listings WHERE id = ?`,
    )
      .bind(id)
      .first<{
        user_id: string | null
        category: string
        title: string
        description: string
        exchange: string
        resilience_points: number | null
        lat: number
        lng: number
        photo_mime: string | null
        photo_data: string | null
        created_at: number
        contact_phone: string | null
        contact_email: string | null
      }>()
    if (!row || row.user_id !== u.id) {
      return c.json({ error: 'Annonce introuvable' }, 404)
    }

    let body: {
      category?: string
      title?: string
      description?: string
      exchange?: string
      resilience_points?: number | null
      lat?: number
      lng?: number
      photo?: unknown
      clear_photo?: boolean
      contact_phone?: unknown
      contact_email?: unknown
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }

    let contact_phone = row.contact_phone
    if ('contact_phone' in body) {
      if (
        body.contact_phone === null ||
        body.contact_phone === '' ||
        (typeof body.contact_phone === 'string' && body.contact_phone.trim() === '')
      ) {
        contact_phone = null
      } else if (typeof body.contact_phone === 'string') {
        contact_phone = normalizeContactPhone(body.contact_phone)
        if (!contact_phone) {
          return c.json(
            {
              error:
                'Téléphone : uniquement chiffres et + ( ) . - espaces, max 48 caractères.',
            },
            400,
          )
        }
      }
    }

    let contact_email = row.contact_email
    if ('contact_email' in body) {
      if (
        body.contact_email === null ||
        body.contact_email === '' ||
        (typeof body.contact_email === 'string' && body.contact_email.trim() === '')
      ) {
        contact_email = null
      } else if (typeof body.contact_email === 'string') {
        contact_email = normalizeContactEmailField(body.contact_email)
        if (!contact_email) return c.json({ error: 'E-mail de contact invalide.' }, 400)
      }
    }

    let category = row.category
    if (body.category !== undefined) {
      category = body.category ?? ''
      if (!FOOD_CATS.includes(category as (typeof FOOD_CATS)[number])) {
        return c.json({ error: 'Catégorie invalide' }, 400)
      }
    }

    let title = row.title
    if (body.title !== undefined) {
      title = (body.title ?? '').trim()
      if (title.length < 3 || title.length > 120) {
        return c.json({ error: 'Titre : 3 à 120 caractères' }, 400)
      }
    }

    let description = row.description
    if (body.description !== undefined) {
      description = (body.description ?? '').trim()
      if (description.length < 10 || description.length > 2000) {
        return c.json({ error: 'Description : 10 à 2000 caractères' }, 400)
      }
    }

    let exchange = row.exchange
    if (body.exchange !== undefined) {
      exchange = (body.exchange ?? '').trim()
      if (exchange.length < 5 || exchange.length > 2000) {
        return c.json({ error: 'Échange : 5 à 2000 caractères' }, 400)
      }
    }

    let resilience_points = row.resilience_points
    if (body.resilience_points !== undefined) {
      if (body.resilience_points === null) {
        resilience_points = null
      } else if (typeof body.resilience_points === 'number') {
        const rp = Math.round(body.resilience_points)
        if (!Number.isFinite(rp) || rp < 0 || rp > 1_000_000) {
          return c.json({ error: 'Points de résilience invalides' }, 400)
        }
        resilience_points = rp
      }
    }

    let lat = row.lat
    let lng = row.lng
    if (body.lat !== undefined) lat = Number(body.lat)
    if (body.lng !== undefined) lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return c.json({ error: 'Position invalide' }, 400)
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return c.json({ error: 'Coordonnées hors bornes' }, 400)
    }

    let photoMime = row.photo_mime
    let photoData = row.photo_data
    if (body.clear_photo === true) {
      photoMime = null
      photoData = null
    } else if (body.photo !== undefined && body.photo !== null) {
      const parsed = validateListingPhoto(body.photo)
      if (!parsed) {
        return c.json(
          {
            error:
              'Photo invalide ou trop volumineuse (max. ~460 Ko après compression). Formats : JPEG, PNG, WebP.',
          },
          400,
        )
      }
      photoMime = parsed.mime
      photoData = parsed.data_base64
    }

    await c.env.DB.prepare(
      `UPDATE food_listings SET category = ?, title = ?, description = ?, exchange = ?, resilience_points = ?,
           lat = ?, lng = ?, photo_mime = ?, photo_data = ?, contact_phone = ?, contact_email = ?
       WHERE id = ? AND user_id = ?`,
    )
      .bind(
        category,
        title,
        description,
        exchange,
        resilience_points,
        lat,
        lng,
        photoMime,
        photoData,
        contact_phone,
        contact_email,
        id,
        u.id,
      )
      .run()

    const snap = snapLatLng(lat, lng)
    const parsedUrl = parseViewer(new URL(c.req.url))
    return c.json({
      listing: {
        id,
        category,
        title,
        description,
        exchange,
        resilience_points,
        approx_lat: snap.lat,
        approx_lng: snap.lng,
        zone_label: zoneLabel(parsedUrl.vl, parsedUrl.vg, snap.lat, snap.lng),
        author_name: u.display_name,
        created_at: row.created_at,
        photo_url: photoUrlFromRow(photoMime, photoData),
        contact_phone,
        contact_email,
        mine: true,
      },
    })
  })

  api.delete('/food/:id', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const id = c.req.param('id')
    const result = await c.env.DB.prepare(
      `DELETE FROM food_listings WHERE id = ? AND user_id = ?`,
    )
      .bind(id, u.id)
      .run()
    const changes = Number(result.meta.changes ?? 0)
    if (changes < 1) return c.json({ error: 'Annonce introuvable' }, 404)
    return c.json({ ok: true })
  })

  api.get('/skills', async (c) => {
    const parsed = parseViewer(new URL(c.req.url))
    const rs = await c.env.DB.prepare(
      `SELECT s.id, s.title, s.offer, s.hoping_for, s.lat, s.lng, s.created_at,
              s.photo_mime, s.photo_data, s.user_id,
              s.contact_phone, s.contact_email,
              u.display_name AS author_name
       FROM skill_listings s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC`,
    ).all()

    const rows = rs.results as Array<{
      id: string
      title: string
      offer: string
      hoping_for: string
      lat: number
      lng: number
      created_at: number
      photo_mime: string | null
      photo_data: string | null
      user_id: string | null
      contact_phone: string | null
      contact_email: string | null
      author_name: string | null
    }>

    const viewerIdSk = c.get('user')?.id ?? null

    return c.json({
      listings: rows.map((r) => {
        const snap = snapLatLng(r.lat, r.lng)
        return {
          id: r.id,
          title: r.title,
          offer: r.offer,
          hoping_for: r.hoping_for,
          approx_lat: snap.lat,
          approx_lng: snap.lng,
          zone_label: zoneLabel(parsed.vl, parsed.vg, snap.lat, snap.lng),
          author_name: r.author_name ?? 'Participant',
          created_at: r.created_at,
          photo_url: photoUrlFromRow(r.photo_mime, r.photo_data),
          contact_phone: r.contact_phone || null,
          contact_email: r.contact_email || null,
          mine:
            viewerIdSk !== null &&
            r.user_id !== null &&
            r.user_id === viewerIdSk,
        }
      }),
    })
  })

  api.get('/public/skills/:id', async (c) => {
    const id = c.req.param('id')
    const url = new URL(c.req.url)
    const { vl, vg } = parseViewer(url)
    const viewerId = c.get('user')?.id ?? null

    const row = await c.env.DB.prepare(
      `SELECT s.id, s.title, s.offer, s.hoping_for, s.lat, s.lng, s.created_at,
              s.photo_mime, s.photo_data, s.contact_phone, s.contact_email, s.user_id,
              u.display_name AS author_name
       FROM skill_listings s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
    )
      .bind(id)
      .first<{
        id: string
        title: string
        offer: string
        hoping_for: string
        lat: number
        lng: number
        created_at: number
        photo_mime: string | null
        photo_data: string | null
        contact_phone: string | null
        contact_email: string | null
        user_id: string | null
        author_name: string | null
      }>()
    if (!row) return c.json({ error: 'Annonce introuvable' }, 404)

    const snap = snapLatLng(row.lat, row.lng)
    return c.json({
      listing: {
        id: row.id,
        title: row.title,
        offer: row.offer,
        hoping_for: row.hoping_for,
        approx_lat: snap.lat,
        approx_lng: snap.lng,
        zone_label: zoneLabel(vl, vg, snap.lat, snap.lng),
        author_name: row.author_name ?? 'Participant',
        created_at: row.created_at,
        photo_url: photoUrlFromRow(row.photo_mime, row.photo_data),
        contact_phone: row.contact_phone || null,
        contact_email: row.contact_email || null,
        mine:
          viewerId !== null &&
          row.user_id !== null &&
          row.user_id === viewerId,
      },
    })
  })

  api.get('/skills/:id', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const id = c.req.param('id')
    const row = await c.env.DB.prepare(
      `SELECT id, user_id, title, offer, hoping_for, lat, lng, created_at, photo_mime, photo_data,
              contact_phone, contact_email
       FROM skill_listings WHERE id = ?`,
    )
      .bind(id)
      .first<{
        id: string
        user_id: string | null
        title: string
        offer: string
        hoping_for: string
        lat: number
        lng: number
        created_at: number
        photo_mime: string | null
        photo_data: string | null
        contact_phone: string | null
        contact_email: string | null
      }>()
    if (!row || row.user_id !== u.id) {
      return c.json({ error: 'Annonce introuvable' }, 404)
    }
    return c.json({
      listing: {
        id: row.id,
        title: row.title,
        offer: row.offer,
        hoping_for: row.hoping_for,
        lat: row.lat,
        lng: row.lng,
        created_at: row.created_at,
        photo_url: photoUrlFromRow(row.photo_mime, row.photo_data),
        contact_phone: row.contact_phone || null,
        contact_email: row.contact_email || null,
      },
    })
  })

  api.post('/skills', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)

    let body: {
      title?: string
      offer?: string
      hoping_for?: string
      lat?: number
      lng?: number
      photo?: unknown
      contact_phone?: unknown
      contact_email?: unknown
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }

    let contact_phoneSk: string | null = null
    if (body.contact_phone !== undefined && body.contact_phone !== null) {
      if (typeof body.contact_phone === 'string' && body.contact_phone.trim() !== '') {
        contact_phoneSk = normalizeContactPhone(body.contact_phone)
        if (!contact_phoneSk) {
          return c.json(
            {
              error:
                'Téléphone : uniquement chiffres et + ( ) . - espaces, max 48 caractères.',
            },
            400,
          )
        }
      }
    }

    let contact_emailSk: string | null = null
    if (body.contact_email !== undefined && body.contact_email !== null) {
      if (typeof body.contact_email === 'string' && body.contact_email.trim() !== '') {
        contact_emailSk = normalizeContactEmailField(body.contact_email)
        if (!contact_emailSk) return c.json({ error: 'E-mail de contact invalide.' }, 400)
      }
    }

    let photoMime: string | null = null
    let photoData: string | null = null
    const rawPhotoSk = body.photo
    if (rawPhotoSk !== undefined && rawPhotoSk !== null) {
      const parsed = validateListingPhoto(rawPhotoSk)
      if (!parsed) {
        return c.json(
          {
            error:
              'Photo invalide ou trop volumineuse (max. ~460 Ko après compression). Formats : JPEG, PNG, WebP.',
          },
          400,
        )
      }
      photoMime = parsed.mime
      photoData = parsed.data_base64
    }

    const title = (body.title ?? '').trim()
    const offer = (body.offer ?? '').trim()
    const hoping_for = (body.hoping_for ?? '').trim()
    if (title.length < 3 || title.length > 120)
      return c.json({ error: 'Titre : 3 à 120 caractères' }, 400)
    if (offer.length < 10 || offer.length > 2000)
      return c.json({ error: 'Proposition : 10 à 2000 caractères' }, 400)
    if (hoping_for.length < 5 || hoping_for.length > 2000)
      return c.json({ error: 'En retour : 5 à 2000 caractères' }, 400)

    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return c.json({ error: 'Position invalide' }, 400)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return c.json({ error: 'Coordonnées hors bornes' }, 400)

    const id = crypto.randomUUID()
    const created = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(
      `INSERT INTO skill_listings (id, user_id, title, offer, hoping_for, lat, lng, created_at, photo_mime, photo_data, contact_phone, contact_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        u.id,
        title,
        offer,
        hoping_for,
        lat,
        lng,
        created,
        photoMime,
        photoData,
        contact_phoneSk,
        contact_emailSk,
      )
      .run()

    const snap = snapLatLng(lat, lng)
    const parsed = parseViewer(new URL(c.req.url))
    return c.json({
      listing: {
        id,
        title,
        offer,
        hoping_for,
        approx_lat: snap.lat,
        approx_lng: snap.lng,
        zone_label: zoneLabel(parsed.vl, parsed.vg, snap.lat, snap.lng),
        author_name: u.display_name,
        created_at: created,
        photo_url: photoUrlFromRow(photoMime, photoData),
        contact_phone: contact_phoneSk,
        contact_email: contact_emailSk,
      },
    })
  })

  api.patch('/skills/:id', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const id = c.req.param('id')

    const row = await c.env.DB.prepare(
      `SELECT user_id, title, offer, hoping_for, lat, lng, photo_mime, photo_data, created_at,
              contact_phone, contact_email
       FROM skill_listings WHERE id = ?`,
    )
      .bind(id)
      .first<{
        user_id: string | null
        title: string
        offer: string
        hoping_for: string
        lat: number
        lng: number
        photo_mime: string | null
        photo_data: string | null
        created_at: number
        contact_phone: string | null
        contact_email: string | null
      }>()
    if (!row || row.user_id !== u.id) {
      return c.json({ error: 'Annonce introuvable' }, 404)
    }

    let body: {
      title?: string
      offer?: string
      hoping_for?: string
      lat?: number
      lng?: number
      photo?: unknown
      clear_photo?: boolean
      contact_phone?: unknown
      contact_email?: unknown
    }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }

    let contact_phone = row.contact_phone
    if ('contact_phone' in body) {
      if (
        body.contact_phone === null ||
        body.contact_phone === '' ||
        (typeof body.contact_phone === 'string' && body.contact_phone.trim() === '')
      ) {
        contact_phone = null
      } else if (typeof body.contact_phone === 'string') {
        contact_phone = normalizeContactPhone(body.contact_phone)
        if (!contact_phone) {
          return c.json(
            {
              error:
                'Téléphone : uniquement chiffres et + ( ) . - espaces, max 48 caractères.',
            },
            400,
          )
        }
      }
    }

    let contact_email = row.contact_email
    if ('contact_email' in body) {
      if (
        body.contact_email === null ||
        body.contact_email === '' ||
        (typeof body.contact_email === 'string' && body.contact_email.trim() === '')
      ) {
        contact_email = null
      } else if (typeof body.contact_email === 'string') {
        contact_email = normalizeContactEmailField(body.contact_email)
        if (!contact_email) return c.json({ error: 'E-mail de contact invalide.' }, 400)
      }
    }

    let title = row.title
    if (body.title !== undefined) {
      title = (body.title ?? '').trim()
      if (title.length < 3 || title.length > 120) {
        return c.json({ error: 'Titre : 3 à 120 caractères' }, 400)
      }
    }

    let offer = row.offer
    if (body.offer !== undefined) {
      offer = (body.offer ?? '').trim()
      if (offer.length < 10 || offer.length > 2000) {
        return c.json({ error: 'Proposition : 10 à 2000 caractères' }, 400)
      }
    }

    let hoping_for = row.hoping_for
    if (body.hoping_for !== undefined) {
      hoping_for = (body.hoping_for ?? '').trim()
      if (hoping_for.length < 5 || hoping_for.length > 2000) {
        return c.json({ error: 'En retour : 5 à 2000 caractères' }, 400)
      }
    }

    let lat = row.lat
    let lng = row.lng
    if (body.lat !== undefined) lat = Number(body.lat)
    if (body.lng !== undefined) lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return c.json({ error: 'Position invalide' }, 400)
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return c.json({ error: 'Coordonnées hors bornes' }, 400)
    }

    let photoMime = row.photo_mime
    let photoData = row.photo_data
    if (body.clear_photo === true) {
      photoMime = null
      photoData = null
    } else if (body.photo !== undefined && body.photo !== null) {
      const parsed = validateListingPhoto(body.photo)
      if (!parsed) {
        return c.json(
          {
            error:
              'Photo invalide ou trop volumineuse (max. ~460 Ko après compression). Formats : JPEG, PNG, WebP.',
          },
          400,
        )
      }
      photoMime = parsed.mime
      photoData = parsed.data_base64
    }

    await c.env.DB.prepare(
      `UPDATE skill_listings SET title = ?, offer = ?, hoping_for = ?, lat = ?, lng = ?, photo_mime = ?, photo_data = ?,
           contact_phone = ?, contact_email = ?
       WHERE id = ? AND user_id = ?`,
    )
      .bind(
        title,
        offer,
        hoping_for,
        lat,
        lng,
        photoMime,
        photoData,
        contact_phone,
        contact_email,
        id,
        u.id,
      )
      .run()

    const snap = snapLatLng(lat, lng)
    const parsedUrl = parseViewer(new URL(c.req.url))
    return c.json({
      listing: {
        id,
        title,
        offer,
        hoping_for,
        approx_lat: snap.lat,
        approx_lng: snap.lng,
        zone_label: zoneLabel(parsedUrl.vl, parsedUrl.vg, snap.lat, snap.lng),
        author_name: u.display_name,
        created_at: row.created_at,
        photo_url: photoUrlFromRow(photoMime, photoData),
        contact_phone,
        contact_email,
        mine: true,
      },
    })
  })

  api.delete('/skills/:id', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const id = c.req.param('id')
    const result = await c.env.DB.prepare(
      `DELETE FROM skill_listings WHERE id = ? AND user_id = ?`,
    )
      .bind(id, u.id)
      .run()
    const changes = Number(result.meta.changes ?? 0)
    if (changes < 1) return c.json({ error: 'Annonce introuvable' }, 404)
    return c.json({ ok: true })
  })

  api.post('/messages/threads', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    let body: { listing_kind?: unknown; listing_id?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const kind = parseListingMessageKind(body.listing_kind)
    const listingId =
      typeof body.listing_id === 'string' ? body.listing_id.trim() : ''
    if (!kind) return c.json({ error: 'Type d’annonce invalide' }, 400)
    if (!listingId) return c.json({ error: 'Annonce invalide' }, 400)

    let ownerId: string | null = null
    if (kind === 'food') {
      const row = await c.env.DB.prepare(
        `SELECT user_id FROM food_listings WHERE id = ?`,
      )
        .bind(listingId)
        .first<{ user_id: string | null }>()
      ownerId = row?.user_id ?? null
    } else {
      const row = await c.env.DB.prepare(
        `SELECT user_id FROM skill_listings WHERE id = ?`,
      )
        .bind(listingId)
        .first<{ user_id: string | null }>()
      ownerId = row?.user_id ?? null
    }
    if (!ownerId) {
      return c.json({ error: 'Annonce introuvable ou sans auteur joignable.' }, 404)
    }
    if (ownerId === u.id) {
      return c.json({ error: 'Vous êtes l’auteur de cette annonce.' }, 400)
    }

    const existing = await c.env.DB.prepare(
      `SELECT id FROM message_threads
       WHERE listing_kind = ? AND listing_id = ? AND peer_user_id = ?`,
    )
      .bind(kind, listingId, u.id)
      .first<{ id: string }>()
    if (existing) return c.json({ thread: { id: existing.id } })

    const threadId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(
      `INSERT INTO message_threads (id, created_at, listing_kind, listing_id, owner_user_id, peer_user_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(threadId, now, kind, listingId, ownerId, u.id, now)
      .run()

    return c.json({ thread: { id: threadId } })
  })

  api.get('/messages/unread-count', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)

    const row = await c.env.DB.prepare(
      `SELECT COUNT(*) AS c
       FROM message_threads t
       WHERE t.listing_kind IS NOT NULL
         AND (t.owner_user_id = ? OR t.peer_user_id = ?)
         AND EXISTS (
           SELECT 1 FROM messages m
           WHERE m.thread_id = t.id
             AND m.sender_id != ?
             AND m.created_at > COALESCE(
               CASE WHEN t.owner_user_id = ? THEN t.owner_last_read_at ELSE t.peer_last_read_at END,
               0
             )
         )`,
    )
      .bind(u.id, u.id, u.id, u.id)
      .first<{ c: number }>()

    return c.json({ count: Number(row?.c ?? 0) })
  })

  api.get('/messages/threads', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)

    const rs = await c.env.DB.prepare(
      `SELECT t.id, t.listing_kind, t.listing_id, t.owner_user_id, t.peer_user_id,
              t.created_at, t.updated_at,
              CASE WHEN t.listing_kind = 'food' THEN f.title ELSE s.title END AS listing_title,
              CASE
                WHEN ? = t.owner_user_id THEN pu.display_name
                ELSE ou.display_name
              END AS counterpart_name,
              (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_preview,
              (SELECT created_at FROM messages m WHERE m.thread_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
              CASE WHEN EXISTS (
                SELECT 1 FROM messages m
                WHERE m.thread_id = t.id
                  AND m.sender_id != ?
                  AND m.created_at > COALESCE(
                    CASE WHEN t.owner_user_id = ? THEN t.owner_last_read_at ELSE t.peer_last_read_at END,
                    0
                  )
              ) THEN 1 ELSE 0 END AS has_unread
       FROM message_threads t
       LEFT JOIN food_listings f ON t.listing_kind = 'food' AND f.id = t.listing_id
       LEFT JOIN skill_listings s ON t.listing_kind = 'skill' AND s.id = t.listing_id
       LEFT JOIN users ou ON ou.id = t.owner_user_id
       LEFT JOIN users pu ON pu.id = t.peer_user_id
       WHERE t.listing_kind IS NOT NULL
         AND (t.owner_user_id = ? OR t.peer_user_id = ?)
       ORDER BY COALESCE(t.updated_at, t.created_at) DESC
       LIMIT 100`,
    )
      .bind(u.id, u.id, u.id, u.id, u.id)
      .all()

    const rows = rs.results as Array<{
      id: string
      listing_kind: string
      listing_id: string
      owner_user_id: string
      peer_user_id: string
      created_at: number
      updated_at: number | null
      listing_title: string | null
      counterpart_name: string | null
      last_preview: string | null
      last_message_at: number | null
      has_unread: number
    }>

    return c.json({
      threads: rows.map((r) => ({
        id: r.id,
        listing_kind: r.listing_kind,
        listing_id: r.listing_id,
        listing_title: r.listing_title ?? 'Annonce',
        counterpart_name: r.counterpart_name ?? 'Participant',
        listing_path: listingDetailPath(r.listing_kind as ListingMessageKind, r.listing_id),
        last_preview: r.last_preview,
        last_message_at: r.last_message_at,
        updated_at: r.updated_at ?? r.created_at,
        has_unread: r.has_unread === 1,
      })),
    })
  })

  api.get('/messages/threads/:threadId', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const threadId = c.req.param('threadId')

    const trow = await c.env.DB.prepare(
      `SELECT t.id, t.listing_kind, t.listing_id, t.owner_user_id, t.peer_user_id,
              t.created_at, t.updated_at,
              CASE WHEN t.listing_kind = 'food' THEN f.title ELSE s.title END AS listing_title,
              CASE
                WHEN ? = t.owner_user_id THEN pu.display_name
                ELSE ou.display_name
              END AS counterpart_name
       FROM message_threads t
       LEFT JOIN food_listings f ON t.listing_kind = 'food' AND f.id = t.listing_id
       LEFT JOIN skill_listings s ON t.listing_kind = 'skill' AND s.id = t.listing_id
       LEFT JOIN users ou ON ou.id = t.owner_user_id
       LEFT JOIN users pu ON pu.id = t.peer_user_id
       WHERE t.id = ?
         AND t.listing_kind IS NOT NULL
         AND (t.owner_user_id = ? OR t.peer_user_id = ?)`,
    )
      .bind(u.id, threadId, u.id, u.id)
      .first<{
        id: string
        listing_kind: string
        listing_id: string
        owner_user_id: string
        peer_user_id: string
        created_at: number
        updated_at: number | null
        listing_title: string | null
        counterpart_name: string | null
      }>()

    if (!trow) return c.json({ error: 'Conversation introuvable' }, 404)

    const msgRs = await c.env.DB.prepare(
      `SELECT id, sender_id, body, created_at FROM messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT 200`,
    )
      .bind(threadId)
      .all()

    const messages = (msgRs.results as Array<{
      id: string
      sender_id: string
      body: string
      created_at: number
    }>).map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      body: m.body,
      created_at: m.created_at,
    }))

    const readNow = Math.floor(Date.now() / 1000)
    await c.env.DB.prepare(
      `UPDATE message_threads SET
         owner_last_read_at = CASE WHEN owner_user_id = ? THEN ? ELSE owner_last_read_at END,
         peer_last_read_at = CASE WHEN peer_user_id = ? THEN ? ELSE peer_last_read_at END
       WHERE id = ?`,
    )
      .bind(u.id, readNow, u.id, readNow, threadId)
      .run()

    const kind = trow.listing_kind as ListingMessageKind
    return c.json({
      thread: {
        id: trow.id,
        listing_kind: kind,
        listing_id: trow.listing_id,
        listing_title: trow.listing_title ?? 'Annonce',
        counterpart_name: trow.counterpart_name ?? 'Participant',
        listing_path: listingDetailPath(kind, trow.listing_id),
      },
      messages,
    })
  })

  api.post('/messages/threads/:threadId/messages', async (c) => {
    const u = c.get('user')
    if (!u) return c.json({ error: 'Connexion requise' }, 401)
    const threadId = c.req.param('threadId')

    const trow = await c.env.DB.prepare(
      `SELECT id FROM message_threads WHERE id = ?
       AND listing_kind IS NOT NULL
       AND (owner_user_id = ? OR peer_user_id = ?)`,
    )
      .bind(threadId, u.id, u.id)
      .first<{ id: string }>()
    if (!trow) return c.json({ error: 'Conversation introuvable' }, 404)

    let body: { body?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'JSON invalide' }, 400)
    }
    const text = normalizeMessageBody(body.body)
    if (!text) {
      return c.json(
        { error: `Message vide ou trop long (max ${MESSAGE_BODY_MAX} caractères).` },
        400,
      )
    }

    const msgId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    await c.env.DB.prepare(
      `INSERT INTO messages (id, thread_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(msgId, threadId, u.id, text, now)
      .run()

    await c.env.DB.prepare(`UPDATE message_threads SET updated_at = ? WHERE id = ?`)
      .bind(now, threadId)
      .run()

    return c.json({
      message: { id: msgId, sender_id: u.id, body: text, created_at: now },
    })
  })

  api.get('/admin/overview', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)
    const now = Math.floor(Date.now() / 1000)
    const since7d = now - 7 * 24 * 3600
    const d = new Date(now * 1000)
    const monthStartSec = Math.floor(
      new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0).getTime() / 1000,
    )

    const [
      users,
      verifiedUsers,
      food,
      skills,
      newsletter,
      partnerships,
      users7d,
      food7d,
      skills7d,
      newsletter7d,
      partnerships7d,
      messageThreads,
      messagesTotal,
      usersMonth,
      foodMonth,
      skillsMonth,
      newsletterMonth,
      partnershipsMonthCount,
      partnershipsMonthRows,
    ] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM users`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM users WHERE verified = 1`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM food_listings`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM skill_listings`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM newsletter_subscribers`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM partnership_leads`).first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM users WHERE created_at >= ?`)
        .bind(since7d)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM food_listings WHERE created_at >= ?`)
        .bind(since7d)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM skill_listings WHERE created_at >= ?`)
        .bind(since7d)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM newsletter_subscribers WHERE created_at >= ?`)
        .bind(since7d)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM partnership_leads WHERE created_at >= ?`)
        .bind(since7d)
        .first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM message_threads`).first<{ c: number }>(),
      c.env.DB.prepare(`SELECT COUNT(*) AS c FROM messages`).first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM users WHERE created_at >= ?`)
        .bind(monthStartSec)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM food_listings WHERE created_at >= ?`)
        .bind(monthStartSec)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM skill_listings WHERE created_at >= ?`)
        .bind(monthStartSec)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM newsletter_subscribers WHERE created_at >= ?`)
        .bind(monthStartSec)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT COUNT(*) AS c FROM partnership_leads WHERE created_at >= ?`)
        .bind(monthStartSec)
        .first<{ c: number }>(),
      c.env.DB
        .prepare(`SELECT plan_interest FROM partnership_leads WHERE created_at >= ?`)
        .bind(monthStartSec)
        .all(),
    ])

    const usersCount = Number(users?.c ?? 0)
    const verifiedCount = Number(verifiedUsers?.c ?? 0)
    const threadCount = Number(messageThreads?.c ?? 0)
    const messagesCount = Number(messagesTotal?.c ?? 0)
    const verificationRate =
      usersCount > 0 ? Number(((verifiedCount / usersCount) * 100).toFixed(1)) : 0
    const avgMessagesPerThread =
      threadCount > 0 ? Number((messagesCount / threadCount).toFixed(2)) : 0
    const monthLeadPlans = partnershipsMonthRows.results as Array<{ plan_interest: string }>
    const partnerRevenueMonthly = monthLeadPlans.reduce((sum, row) => {
      switch (row.plan_interest) {
        case 'bronze':
          return sum + 39
        case 'argent':
          return sum + 89
        case 'or':
          return sum + 189
        default:
          return sum
      }
    }, 0)

    return c.json({
      counts: {
        users: usersCount,
        food_listings: Number(food?.c ?? 0),
        skill_listings: Number(skills?.c ?? 0),
        newsletter_subscribers: Number(newsletter?.c ?? 0),
        partnership_leads: Number(partnerships?.c ?? 0),
      },
      stats: {
        verified_users: verifiedCount,
        verification_rate_pct: verificationRate,
        new_users_7d: Number(users7d?.c ?? 0),
        new_food_7d: Number(food7d?.c ?? 0),
        new_skills_7d: Number(skills7d?.c ?? 0),
        new_newsletter_7d: Number(newsletter7d?.c ?? 0),
        new_partnerships_7d: Number(partnerships7d?.c ?? 0),
        message_threads: threadCount,
        messages_total: messagesCount,
        avg_messages_per_thread: avgMessagesPerThread,
        month_label: new Date(monthStartSec * 1000).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
        new_users_month: Number(usersMonth?.c ?? 0),
        new_food_month: Number(foodMonth?.c ?? 0),
        new_skills_month: Number(skillsMonth?.c ?? 0),
        new_newsletter_month: Number(newsletterMonth?.c ?? 0),
        new_partnerships_month: Number(partnershipsMonthCount?.c ?? 0),
        partner_revenue_monthly_estimate: partnerRevenueMonthly,
      },
    })
  })

  api.get('/admin/newsletter', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)

    const rs = await c.env.DB.prepare(
      `SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 1000`,
    ).all()
    return c.json({
      subscribers: (rs.results as Array<{ id: string; email: string; created_at: number }>).map(
        (r) => ({
          id: r.id,
          email: r.email,
          created_at: r.created_at,
        }),
      ),
    })
  })

  api.get('/admin/partnerships', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)

    const rs = await c.env.DB.prepare(
      `SELECT id, contact_name, organization, email, phone, plan_interest, message, created_at
       FROM partnership_leads
       ORDER BY created_at DESC
       LIMIT 1000`,
    ).all()

    let pay: D1Result<Record<string, unknown>>
    try {
      pay = await c.env.DB.prepare(
        `SELECT id, stripe_event_id, kind, amount_total, currency, customer_email, payment_status, checkout_mode, stripe_session_id, stripe_invoice_id, stripe_subscription_id, label, created_at
         FROM support_stripe_events
         ORDER BY created_at DESC
         LIMIT 1000`,
      ).all()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('support_stripe_events') || msg.includes('no such table')) {
        pay = { success: true, meta: {} as D1Meta, results: [] }
      } else {
        throw e
      }
    }

    type LeadRow = {
      id: string
      contact_name: string
      organization: string
      email: string
      phone: string | null
      plan_interest: string
      message: string
      created_at: number
    }

    type PayRow = {
      id: string
      stripe_event_id: string
      kind: string
      amount_total: number | null
      currency: string
      customer_email: string | null
      payment_status: string | null
      checkout_mode: string | null
      stripe_session_id: string | null
      stripe_invoice_id: string | null
      stripe_subscription_id: string | null
      label: string
      created_at: number
    }

    return c.json({
      leads: (rs.results as LeadRow[]).map((r) => ({
        id: r.id,
        contact_name: r.contact_name,
        organization: r.organization,
        email: r.email,
        phone: r.phone,
        plan_interest: r.plan_interest,
        message: r.message,
        created_at: r.created_at,
      })),
      payments: (pay.results as PayRow[]).map((r) => ({
        id: r.id,
        stripe_event_id: r.stripe_event_id,
        kind: r.kind,
        amount_total: r.amount_total,
        currency: r.currency,
        customer_email: r.customer_email,
        payment_status: r.payment_status,
        checkout_mode: r.checkout_mode,
        stripe_session_id: r.stripe_session_id,
        stripe_invoice_id: r.stripe_invoice_id,
        stripe_subscription_id: r.stripe_subscription_id,
        label: r.label,
        created_at: r.created_at,
      })),
    })
  })

  api.get('/admin/users', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)

    const rs = await c.env.DB.prepare(
      `SELECT id, email, display_name, verified, created_at FROM users ORDER BY created_at DESC LIMIT 1000`,
    ).all()

    return c.json({
      users: (rs.results as Array<{
        id: string
        email: string
        display_name: string
        verified: number
        created_at: number
      }>).map((r) => ({
        id: r.id,
        email: r.email,
        display_name: r.display_name,
        verified: r.verified,
        created_at: r.created_at,
      })),
    })
  })

  api.get('/admin/listings', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)

    const [foodRs, skillRs] = await Promise.all([
      c.env.DB.prepare(
        `SELECT id, title, created_at, user_id FROM food_listings ORDER BY created_at DESC LIMIT 1000`,
      ).all(),
      c.env.DB.prepare(
        `SELECT id, title, created_at, user_id FROM skill_listings ORDER BY created_at DESC LIMIT 1000`,
      ).all(),
    ])

    return c.json({
      food: foodRs.results as Array<{
        id: string
        title: string
        created_at: number
        user_id: string | null
      }>,
      skills: skillRs.results as Array<{
        id: string
        title: string
        created_at: number
        user_id: string | null
      }>,
    })
  })

  api.delete('/admin/users/:id', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)
    const id = c.req.param('id')
    if (id === adm.user.id) return c.json({ error: 'Impossible de supprimer votre propre compte.' }, 400)
    const result = await c.env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run()
    const changes = Number(result.meta.changes ?? 0)
    if (changes < 1) return c.json({ error: 'Utilisateur introuvable' }, 404)
    return c.json({ ok: true })
  })

  api.delete('/admin/food/:id', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)
    const id = c.req.param('id')
    const result = await c.env.DB.prepare(`DELETE FROM food_listings WHERE id = ?`).bind(id).run()
    const changes = Number(result.meta.changes ?? 0)
    if (changes < 1) return c.json({ error: 'Annonce introuvable' }, 404)
    return c.json({ ok: true })
  })

  api.delete('/admin/skills/:id', async (c) => {
    const adm = requireAdmin(c)
    if (!adm.ok) return c.json({ error: adm.message }, adm.status)
    const id = c.req.param('id')
    const result = await c.env.DB.prepare(`DELETE FROM skill_listings WHERE id = ?`).bind(id).run()
    const changes = Number(result.meta.changes ?? 0)
    if (changes < 1) return c.json({ error: 'Annonce introuvable' }, 404)
    return c.json({ ok: true })
  })

  api.get('/map/markers', async (c) => {
    const parsed = parseViewer(new URL(c.req.url))
    const foodRs = await c.env.DB.prepare(
      `SELECT id, category, title, lat, lng FROM food_listings ORDER BY created_at DESC LIMIT 200`,
    ).all()
    const skillRs = await c.env.DB.prepare(
      `SELECT id, title, lat, lng FROM skill_listings ORDER BY created_at DESC LIMIT 200`,
    ).all()

    const food = (foodRs.results as Array<{ id: string; category: string; title: string; lat: number; lng: number }>).map(
      (r) => {
        const snap = snapLatLng(r.lat, r.lng)
        return {
          kind: 'food' as const,
          id: r.id,
          label: r.title,
          category: r.category,
          approx_lat: snap.lat,
          approx_lng: snap.lng,
          radius_m: 850,
          zone_label: zoneLabel(parsed.vl, parsed.vg, snap.lat, snap.lng),
        }
      },
    )

    const skills = (skillRs.results as Array<{ id: string; title: string; lat: number; lng: number }>).map(
      (r) => {
        const snap = snapLatLng(r.lat, r.lng)
        return {
          kind: 'skill' as const,
          id: r.id,
          label: r.title,
          approx_lat: snap.lat,
          approx_lng: snap.lng,
          radius_m: 850,
          zone_label: zoneLabel(parsed.vl, parsed.vg, snap.lat, snap.lng),
        }
      },
    )

    return c.json({
      center:
        parsed.vl != null && parsed.vg != null
          ? { lat: parsed.vl, lng: parsed.vg }
          : food[0]
            ? { lat: food[0].approx_lat, lng: food[0].approx_lng }
            : { lat: 46.5, lng: 2.5 },
      markers: [...food, ...skills],
    })
  })

  api.get('/map/near-summary', async (c) => {
    const url = new URL(c.req.url)
    const lat = Number(url.searchParams.get('lat'))
    const lng = Number(url.searchParams.get('lng'))
    const radiusKm = Math.min(50, Math.max(5, Number(url.searchParams.get('radius_km')) || 10))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return c.json({ error: 'lat/lng requis' }, 400)
    }

    const foodRs = await c.env.DB.prepare(`SELECT lat, lng FROM food_listings`).all()
    const skillRs = await c.env.DB.prepare(`SELECT lat, lng FROM skill_listings`).all()

    const nearFood = (foodRs.results as Array<{ lat: number; lng: number }>).filter(
      (r) => haversineKm(lat, lng, r.lat, r.lng) <= radiusKm,
    ).length
    const nearSkills = (skillRs.results as Array<{ lat: number; lng: number }>).filter(
      (r) => haversineKm(lat, lng, r.lat, r.lng) <= radiusKm,
    ).length

    return c.json({ radius_km: radiusKm, food_count: nearFood, skill_count: nearSkills })
  })

  return api
}
