/** Envoi transactionnel via Resend (https://resend.com). */

export type MailBindings = {
  RESEND_API_KEY?: string
  MAIL_FROM?: string
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function randomUrlToken(): string {
  const u = new Uint8Array(32)
  crypto.getRandomValues(u)
  return [...u].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendResend(
  env: MailBindings,
  opts: { to: string; subject: string; html: string; text: string },
): Promise<boolean> {
  const key = env.RESEND_API_KEY
  if (!key) {
    console.warn('[mail] RESEND_API_KEY absent — email non envoyé')
    return false
  }
  const from =
    env.MAIL_FROM ?? 'Troc et Survie <onboarding@resend.dev>'
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  })
  if (!r.ok) {
    const t = await r.text()
    console.error('[mail] Resend', r.status, t)
    return false
  }
  return true
}

export async function sendVerificationEmail(
  env: MailBindings,
  opts: {
    to: string
    displayName: string
    token: string
    siteUrl: string
  },
): Promise<boolean> {
  const link = `${opts.siteUrl.replace(/\/$/, '')}/confirmer-email?token=${encodeURIComponent(opts.token)}`
  const safeName = escapeHtml(opts.displayName)
  const subject = 'Confirmez votre adresse — Troc et Survie'
  const text = `Bonjour ${opts.displayName},

Merci de vous être inscrit·e sur Troc et Survie.

Pour confirmer votre adresse e-mail, ouvrez ce lien dans votre navigateur (valide 48 h) :
${link}

Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.

— Troc et Survie`
  const html = `<p>Bonjour ${safeName},</p>
<p>Merci de vous être inscrit·e sur <strong>Troc et Survie</strong>.</p>
<p><a href="${escapeHtml(link)}">Confirmer mon adresse e-mail</a></p>
<p style="color:#666;font-size:14px;">Ce lien expire dans 48 heures. Si le bouton ne fonctionne pas, copiez-collez l’URL suivante dans votre navigateur :<br/>${escapeHtml(link)}</p>
<p style="color:#666;font-size:14px;">Si vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer ce message.</p>`
  return sendResend(env, { to: opts.to, subject, html, text })
}

export async function sendPasswordResetEmail(
  env: MailBindings,
  opts: {
    to: string
    displayName: string
    token: string
    siteUrl: string
  },
): Promise<boolean> {
  const link = `${opts.siteUrl.replace(/\/$/, '')}/reinitialiser-mot-de-passe?token=${encodeURIComponent(opts.token)}`
  const safeName = escapeHtml(opts.displayName)
  const subject = 'Réinitialiser votre mot de passe — Troc et Survie'
  const text = `Bonjour ${opts.displayName},

Une demande de nouveau mot de passe a été faite pour votre compte Troc et Survie.

Pour choisir un nouveau mot de passe, ouvrez ce lien (valide 1 h) :
${link}

Si vous n’avez pas demandé cette réinitialisation, ignorez ce message : votre mot de passe actuel reste inchangé.

— Troc et Survie`
  const html = `<p>Bonjour ${safeName},</p>
<p>Une demande de <strong>nouveau mot de passe</strong> a été faite pour votre compte.</p>
<p><a href="${escapeHtml(link)}">Choisir un nouveau mot de passe</a></p>
<p style="color:#666;font-size:14px;">Ce lien expire dans 1 heure.</p>
<p style="color:#666;font-size:14px;">Si vous n’avez pas fait cette demande, ignorez ce message.</p>`
  return sendResend(env, { to: opts.to, subject, html, text })
}
