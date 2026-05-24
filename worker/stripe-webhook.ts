/**
 * Webhook Stripe : uniquement dons / abonnements partenaires (page Soutenir, liens Payment Link).
 * Aucun lien avec inscription, sessions ou table `users` — pas de customer_id D1, pas d’upgrade de compte.
 */
import Stripe from 'stripe'
import type { Env } from './app'

function stripeRefId(ref: unknown): string | null {
  if (ref == null) return null
  if (typeof ref === 'string') return ref
  if (typeof ref === 'object' && ref !== null && 'id' in ref && typeof (ref as { id: unknown }).id === 'string') {
    return (ref as { id: string }).id
  }
  return null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const secret = env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return new Response('Webhook Stripe non configuré (STRIPE_WEBHOOK_SECRET)', { status: 503 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) return new Response('Signature absente', { status: 400 })

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return new Response('Corps invalide', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = Stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (e) {
    console.error('[stripe webhook] signature', e)
    return new Response('Signature invalide', { status: 400 })
  }

  const nowSec = Math.floor(Date.now() / 1000)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status !== 'paid') break

        const email =
          session.customer_details?.email ?? session.customer_email ?? null
        const amount = session.amount_total ?? 0
        const cur = (session.currency ?? 'eur').toLowerCase()
        const mode = session.mode ?? 'payment'
        const subId = stripeRefId(session.subscription)

        const label =
          mode === 'subscription'
            ? `Abonnement — ${(amount / 100).toFixed(2)} ${cur.toUpperCase()}`
            : `Don / paiement — ${(amount / 100).toFixed(2)} ${cur.toUpperCase()}`

        await env.DB.prepare(
          `INSERT OR IGNORE INTO support_stripe_events
           (id, stripe_event_id, kind, amount_total, currency, customer_email, payment_status, checkout_mode, stripe_session_id, stripe_invoice_id, stripe_subscription_id, label, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            crypto.randomUUID(),
            event.id,
            event.type,
            amount,
            cur,
            email,
            session.payment_status ?? null,
            mode,
            session.id,
            null,
            subId,
            label,
            nowSec,
          )
          .run()
        break
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice
        if ((inv.amount_paid ?? 0) <= 0) break
        if (inv.billing_reason !== 'subscription_cycle') break

        const email = inv.customer_email ?? null
        const amount = inv.amount_paid ?? 0
        const cur = (inv.currency ?? 'eur').toLowerCase()
        const subId = stripeRefId(inv.subscription)

        const label = `Renouvellement abonnement — ${(amount / 100).toFixed(2)} ${cur.toUpperCase()}`

        await env.DB.prepare(
          `INSERT OR IGNORE INTO support_stripe_events
           (id, stripe_event_id, kind, amount_total, currency, customer_email, payment_status, checkout_mode, stripe_session_id, stripe_invoice_id, stripe_subscription_id, label, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            crypto.randomUUID(),
            event.id,
            event.type,
            amount,
            cur,
            email,
            inv.status ?? 'paid',
            null,
            null,
            inv.id,
            subId,
            label,
            nowSec,
          )
          .run()
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[stripe webhook] persistence', e)
    return new Response('Erreur enregistrement', { status: 500 })
  }

  return json({ received: true })
}
