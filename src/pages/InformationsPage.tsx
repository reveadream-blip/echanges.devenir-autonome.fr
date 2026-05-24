import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiPostJson } from '../lib/api'

export function InformationsPage() {
  const [partnerForm, setPartnerForm] = useState({
    contact_name: '',
    organization: '',
    email: '',
    phone: '',
    plan_interest: 'bronze',
    message: '',
  })
  const [partnerPending, setPartnerPending] = useState(false)
  const [partnerNote, setPartnerNote] = useState<string | null>(null)

  async function onPartnerSubmit(e: FormEvent) {
    e.preventDefault()
    setPartnerPending(true)
    setPartnerNote(null)
    const res = await apiPostJson<{ ok: true }>('/api/partnerships/lead', partnerForm)
    setPartnerPending(false)
    if (!res.ok) {
      setPartnerNote(res.message)
      return
    }
    setPartnerForm({
      contact_name: '',
      organization: '',
      email: '',
      phone: '',
      plan_interest: 'bronze',
      message: '',
    })
    setPartnerNote('Demande envoyée. Nous revenons vers vous rapidement.')
  }

  return (
    <div className="stack-lg">
      <header className="page-header">
        <p className="eyebrow">Cadre</p>
        <h1>Informations, juridique et confidentialité</h1>
        <p className="lede">
          Ce texte informe les utilisateurs ; il ne remplace pas un conseil
          juridique personnalisé.
        </p>
      </header>

      <section className="card prose-block">
        <h2>Sanitaire et responsabilité</h2>
        <p className="muted small">
          Les échanges portent sur des denrées ou objets présentés par des
          particuliers. <strong>Aucune garantie</strong> n’est donnée sur la
          qualité, la DLC, les allergènes ou les conditions de conservation.
          Chaque personne évalue les risques avant consommation ou usage.
        </p>
      </section>

      <section className="card prose-block">
        <h2>Réglementation (France)</h2>
        <p className="muted small">
          Le troc entre particuliers est possible ; il ne doit pas constituer une
          activité commerciale régulière déguisée (fréquence, volumes,
          rémunération équivalente à une vente). Pour toute structure
          associative ou événementielle, vérifiez les obligations locales
          (hygiène, assurance, déclarations).
        </p>
      </section>

      <section className="card prose-block">
        <h2>Confidentialité et tension sociale</h2>
        <p className="muted small">
          Prévoir <strong>zones approximatives</strong>, pas d’adresse précise
          dans les fiches publiques. Les rendez-vous et détails sensibles devront
          passer par une messagerie privée (structure prévue en base, UI à
          brancher). Minimiser la donnée stockée ; privilégier HTTPS et des
          sauvegardes chiffrées côté infrastructure.
        </p>
      </section>

      <section className="card prose-block">
        <h2>Architecture technique (instance actuelle)</h2>
        <p className="muted small">
          Frontend React + Vite + PWA ; API sur Cloudflare Worker avec base{' '}
          <strong>D1</strong> (SQLite). Sessions HTTP-only ; mots de passe
          dérivés en PBKDF2 côté Worker. Les coordonnées précises restent en base
          mais ne sont renvoyées à l’interface qu’après arrondi (~1,1 km) ; la
          carte dessine des cercles indicatifs.
        </p>
      </section>

      <section className="card prose-block">
        <h2>Intégration au site « Devenir autonome »</h2>
        <ul className="checklist muted small">
          <li>
            <strong>Sous-domaine</strong> (
            <a href="https://echanges.devenirautonome.fr/">echanges.devenirautonome.fr</a>
            ) : découplage technique et SEO distinct du site vitrine, souvent
            le meilleur compromis robustesse / simplicité.
          </li>
          <li>
            <strong>Répertoire / sous-chemin</strong> (
            <span className="nowrap">devenirautonome.fr/echanges</span>) : peut
            renforcer le maillage SEO si le CMS principal gère bien les SPA
            (fallback HTML, pas de 404 sur refresh). Nécessite une config
            reverse-proxy ou hébergeur compatible.
          </li>
          <li>
            <strong>Lien profond + iframe</strong> : rapide mais UX et SEO
            généralement inférieurs ; cookies tiers / sandbox à traiter avec
            prudence.
          </li>
        </ul>
      </section>

      <section id="partenaires" className="card prose-block info-partner-block">
        <h2>Partenariats et sponsoring local</h2>
        <p className="muted small">
          Pour les <strong>dons des particuliers</strong> et les{' '}
          <strong>offres partenaires en ligne</strong> (Stripe), rendez-vous sur la page dédiée{' '}
          <Link to="/soutenir">Soutenir le réseau</Link>.
        </p>
        <p className="muted small">
          L’accès à la plateforme reste gratuit pour les citoyens. Le fonctionnement
          (infrastructure, modération, évolutions) est financé par des partenaires
          locaux et acteurs engagés.
        </p>
        <ul className="checklist muted small">
          <li>
            <strong>Bronze (39 EUR / mois)</strong> : page partenaires, logo, lien externe,
            mention de soutien local.
          </li>
          <li>
            <strong>Argent (89 EUR / mois)</strong> : avantages Bronze + bannière sponsor en
            rotation sur la page d’accueil + publication focus partenaire (1 / trimestre).
          </li>
          <li>
            <strong>Or (189 EUR / mois)</strong> : logo + lien en mise en avant prioritaire +
            bannière prioritaire + votre page personnalisée.
          </li>
          <li>
            <strong>Collectivités / associations (sur devis)</strong> : page dédiée, campagne
            locale, accompagnement de déploiement et indicateurs de suivi.
          </li>
        </ul>
        <p className="small">
          Contact :{' '}
          <a href="mailto:partenaires@devenirautonome.fr?subject=Demande%20partenariat%20Troc%20et%20Survie">
            partenaires@devenirautonome.fr
          </a>
        </p>
        <form className="admin-partner-form" onSubmit={onPartnerSubmit}>
          <label className="small muted">
            Nom du contact
            <input
              className="form-input"
              value={partnerForm.contact_name}
              onChange={(e) =>
                setPartnerForm((p) => ({ ...p, contact_name: e.target.value }))
              }
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="small muted">
            Structure (entreprise / association / collectivité)
            <input
              className="form-input"
              value={partnerForm.organization}
              onChange={(e) =>
                setPartnerForm((p) => ({ ...p, organization: e.target.value }))
              }
              required
              minLength={2}
              maxLength={160}
            />
          </label>
          <div className="coord-grid">
            <label className="small muted">
              E-mail
              <input
                className="form-input"
                type="email"
                value={partnerForm.email}
                onChange={(e) =>
                  setPartnerForm((p) => ({ ...p, email: e.target.value }))
                }
                required
              />
            </label>
            <label className="small muted">
              Téléphone (optionnel)
              <input
                className="form-input"
                type="tel"
                value={partnerForm.phone}
                onChange={(e) =>
                  setPartnerForm((p) => ({ ...p, phone: e.target.value }))
                }
                maxLength={48}
              />
            </label>
          </div>
          <label className="small muted">
            Pack souhaité
            <select
              className="form-input"
              value={partnerForm.plan_interest}
              onChange={(e) =>
                setPartnerForm((p) => ({ ...p, plan_interest: e.target.value }))
              }
              required
            >
              <option value="bronze">Bronze</option>
              <option value="argent">Argent</option>
              <option value="or">Or</option>
              <option value="collectivite">Collectivité / association (sur devis)</option>
            </select>
          </label>
          <label className="small muted">
            Votre besoin
            <textarea
              className="form-input form-textarea"
              value={partnerForm.message}
              onChange={(e) =>
                setPartnerForm((p) => ({ ...p, message: e.target.value }))
              }
              required
              minLength={10}
              maxLength={4000}
              rows={4}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={partnerPending}>
            {partnerPending ? 'Envoi…' : 'Envoyer la demande'}
          </button>
          {partnerNote ? <p className="small muted">{partnerNote}</p> : null}
        </form>
      </section>
    </div>
  )
}
