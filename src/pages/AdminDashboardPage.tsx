import { useEffect, useState } from 'react'
import { apiDeleteJson, apiGetJson } from '../lib/api'
import type {
  AdminListingRow,
  AdminNewsletterSubscriber,
  AdminOverviewCounts,
  AdminOverviewStats,
  AdminPartnershipLead,
  AdminSupportPayment,
  AdminUserRow,
} from '../types/api'

function formatSupportAmount(cents: number | null, currency: string): string {
  if (cents == null) return '—'
  const u = currency?.toUpperCase() ?? 'EUR'
  return `${(cents / 100).toFixed(2)} ${u}`
}

function paymentCategory(p: AdminSupportPayment): string {
  if (p.kind === 'checkout.session.completed') {
    return p.checkout_mode === 'subscription' ? 'Abonnement (1er paiement)' : 'Don / paiement'
  }
  if (p.kind === 'invoice.paid') return 'Abonnement (renouvellement)'
  return p.kind
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<AdminOverviewCounts | null>(null)
  const [stats, setStats] = useState<AdminOverviewStats | null>(null)
  const [subscribers, setSubscribers] = useState<AdminNewsletterSubscriber[]>([])
  const [leads, setLeads] = useState<AdminPartnershipLead[]>([])
  const [payments, setPayments] = useState<AdminSupportPayment[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [food, setFood] = useState<AdminListingRow[]>([])
  const [skills, setSkills] = useState<AdminListingRow[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)

  async function loadAll() {
    setError(null)
    const [ov, nl, pl, us, li] = await Promise.all([
      apiGetJson<{ counts: AdminOverviewCounts; stats: AdminOverviewStats }>('/api/admin/overview'),
      apiGetJson<{ subscribers: AdminNewsletterSubscriber[] }>('/api/admin/newsletter'),
      apiGetJson<{ leads: AdminPartnershipLead[]; payments: AdminSupportPayment[] }>(
        '/api/admin/partnerships',
      ),
      apiGetJson<{ users: AdminUserRow[] }>('/api/admin/users'),
      apiGetJson<{ food: AdminListingRow[]; skills: AdminListingRow[] }>('/api/admin/listings'),
    ])
    if (!ov.ok) return setError(ov.message)
    if (!nl.ok) return setError(nl.message)
    if (!pl.ok) return setError(pl.message)
    if (!us.ok) return setError(us.message)
    if (!li.ok) return setError(li.message)

    setCounts(ov.data.counts)
    setStats(ov.data.stats)
    setSubscribers(nl.data.subscribers ?? [])
    setLeads(pl.data.leads ?? [])
    setPayments(pl.data.payments ?? [])
    setUsers(us.data.users ?? [])
    setFood(li.data.food ?? [])
    setSkills(li.data.skills ?? [])
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadAll()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function remove(path: string, key: string, confirmText: string) {
    if (!window.confirm(confirmText)) return
    setBusyKey(key)
    const res = await apiDeleteJson(path)
    setBusyKey(null)
    if (!res.ok) {
      window.alert(res.message)
      return
    }
    await loadAll()
  }

  if (loading) return <p className="muted">Chargement du dashboard admin…</p>
  if (error) return <p className="callout small">{error}</p>
  if (!counts || !stats) return <p className="callout small">Aucune donnée.</p>

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Administration</p>
        <h1>Dashboard admin</h1>
        <p className="lede">Pilotage global : comptes, annonces, newsletter, partenariats.</p>
      </header>

      <section className="card admin-summary">
        <div className="admin-summary__head">
          <p className="eyebrow">Synthèse mensuelle</p>
          <h2>{stats.month_label}</h2>
          <p className="muted small">
            Vue consolidée du mois en cours : revenus partenaires estimés, inscriptions et activité.
          </p>
        </div>
        <div className="admin-summary__revenue">
          <p className="small muted">Revenu partenaire estimé (mensuel)</p>
          <strong>{stats.partner_revenue_monthly_estimate} EUR</strong>
        </div>
        <div className="admin-grid admin-grid--summary">
          <article className="admin-stat">
            <h3>Nouveaux membres (mois)</h3>
            <p>{stats.new_users_month}</p>
          </article>
          <article className="admin-stat">
            <h3>Annonces troc émises (mois)</h3>
            <p>{stats.new_food_month}</p>
          </article>
          <article className="admin-stat">
            <h3>Annonces compétences (mois)</h3>
            <p>{stats.new_skills_month}</p>
          </article>
          <article className="admin-stat">
            <h3>Inscriptions newsletter (mois)</h3>
            <p>{stats.new_newsletter_month}</p>
          </article>
          <article className="admin-stat">
            <h3>Nouveaux partenaires (mois)</h3>
            <p>{stats.new_partnerships_month}</p>
          </article>
          <article className="admin-stat">
            <h3>Messages / conversations</h3>
            <p>{stats.avg_messages_per_thread}</p>
            <span className="small muted">
              {stats.messages_total} messages pour {stats.message_threads} conversations
            </span>
          </article>
          <article className="admin-stat">
            <h3>Comptes vérifiés</h3>
            <p>{stats.verified_users}</p>
            <span className="small muted">{stats.verification_rate_pct}% du total</span>
          </article>
          <article className="admin-stat">
            <h3>Base utilisateurs totale</h3>
            <p>{counts.users}</p>
          </article>
        </div>
      </section>

      <section className="card prose-block admin-table-wrap">
        <h2>Demandes partenaires &amp; soutiens Stripe</h2>
        <p className="small muted">
          Formulaires envoyés depuis la page Informations, plus les{' '}
          <strong>dons et abonnements</strong> passés par Stripe (alimentés automatiquement si le
          webhook est configuré).
        </p>

        <p className="eyebrow" style={{ marginTop: '1.25rem' }}>
          Formulaires « partenaire »
        </p>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Contact</th>
                <th>Structure</th>
                <th>Pack</th>
                <th>E-mail</th>
                <th>Téléphone</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at * 1000).toLocaleString('fr-FR')}</td>
                  <td>{l.contact_name}</td>
                  <td>{l.organization}</td>
                  <td>{l.plan_interest}</td>
                  <td>
                    <a href={`mailto:${l.email}`}>{l.email}</a>
                  </td>
                  <td>{l.phone ?? '—'}</td>
                  <td>{l.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="eyebrow" style={{ marginTop: '1.35rem' }}>
          Dons &amp; abonnements (Stripe)
        </p>
        <p className="small muted">
          Endpoint webhook à déclarer dans Stripe :{' '}
          <code className="nowrap">
            {(import.meta.env.VITE_PUBLIC_SITE_URL ?? 'https://echanges.devenirautonome.fr').replace(
              /\/$/,
              '',
            )}
            /api/stripe/webhook
          </code>{' '}
          — événements : <code>checkout.session.completed</code>,{' '}
          <code>invoice.paid</code> (renouvellements).
        </p>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>E-mail client</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Détail</th>
                <th>Réf. Stripe</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at * 1000).toLocaleString('fr-FR')}</td>
                  <td>
                    {p.customer_email ? (
                      <a href={`mailto:${p.customer_email}`}>{p.customer_email}</a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{formatSupportAmount(p.amount_total, p.currency)}</td>
                  <td>{paymentCategory(p)}</td>
                  <td>{p.payment_status ?? '—'}</td>
                  <td>{p.label}</td>
                  <td className="small muted">
                    {p.stripe_session_id ? (
                      <span className="nowrap" title={p.stripe_session_id}>
                        cs …{p.stripe_session_id.slice(-8)}
                      </span>
                    ) : p.stripe_invoice_id ? (
                      <span className="nowrap" title={p.stripe_invoice_id}>
                        in …{p.stripe_invoice_id.slice(-8)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 ? (
          <p className="small muted" style={{ marginTop: '0.5rem' }}>
            Aucun paiement en base pour l’instant. Après migration D1 et secret{' '}
            <code>STRIPE_WEBHOOK_SECRET</code>, les prochains paiements apparaîtront ici.
          </p>
        ) : null}
      </section>

      <section className="card prose-block admin-table-wrap">
        <h2>Emails newsletter</h2>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.created_at * 1000).toLocaleString('fr-FR')}</td>
                  <td>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card prose-block admin-table-wrap">
        <h2>Comptes utilisateurs</h2>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pseudo</th>
                <th>Email</th>
                <th>Vérifié</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.display_name}</td>
                  <td>{u.email}</td>
                  <td>{u.verified === 1 ? 'Oui' : 'Non'}</td>
                  <td>{new Date(u.created_at * 1000).toLocaleString('fr-FR')}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busyKey === `u:${u.id}`}
                      onClick={() =>
                        void remove(
                          `/api/admin/users/${encodeURIComponent(u.id)}`,
                          `u:${u.id}`,
                          `Supprimer le compte ${u.display_name} ?`,
                        )
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card prose-block admin-table-wrap">
        <h2>Annonces troc</h2>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Auteur (id)</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {food.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.user_id ?? '—'}</td>
                  <td>{new Date(r.created_at * 1000).toLocaleString('fr-FR')}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busyKey === `f:${r.id}`}
                      onClick={() =>
                        void remove(
                          `/api/admin/food/${encodeURIComponent(r.id)}`,
                          `f:${r.id}`,
                          `Supprimer l'annonce troc "${r.title}" ?`,
                        )
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card prose-block admin-table-wrap">
        <h2>Annonces compétences</h2>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Auteur (id)</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.user_id ?? '—'}</td>
                  <td>{new Date(r.created_at * 1000).toLocaleString('fr-FR')}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={busyKey === `s:${r.id}`}
                      onClick={() =>
                        void remove(
                          `/api/admin/skills/${encodeURIComponent(r.id)}`,
                          `s:${r.id}`,
                          `Supprimer la compétence "${r.title}" ?`,
                        )
                      }
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
