import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { stripeHref, supportLinks, supportPriceIds } from '../lib/supportLinks'

function StripeButton({
  href,
  priceId,
  children,
  className = 'btn btn-primary',
}: {
  href?: string
  priceId?: string
  children: ReactNode
  className?: string
}) {
  if (href) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <span
      className={`${className} support-stripe-placeholder`}
      title={
        priceId
          ? `Price ID configuré: ${priceId}. Ajoutez le Payment Link Stripe pour activer le bouton.`
          : 'À configurer côté site'
      }
    >
      {children}
    </span>
  )
}

export function SoutenirPage() {
  return (
    <div className="stack-lg support-page">
      <header className="support-hero card">
        <p className="eyebrow">Solidarité &amp; indépendance</p>
        <h1>Bâtir la résilience ensemble</h1>
        <p className="lede muted">
          Un réseau indépendant, financé par ceux qui croient à l’entraide locale, pas par la
          publicité ni la revente de données.
        </p>
      </header>

      <section className="card support-section support-section--why">
        <h2 className="support-section__title">Pourquoi nous soutenir ?</h2>
        <blockquote className="support-quote">
          <p>
            « Pour garantir que nos outils (Troc &amp; Savoir-Faire et l’écosystème Devenir
            autonome) restent <strong>gratuits pour les citoyens</strong>, sans publicité intrusive
            et sans exploitation des données, nous comptons sur la{' '}
            <strong>solidarité</strong> de la communauté et des acteurs de terrain. »
          </p>
        </blockquote>
        <p className="muted small">
          Votre geste finance l’hébergement, la sécurité, la modération et le développement, au
          service du commun.
        </p>
      </section>

      <section className="card support-section">
        <p className="eyebrow">Particuliers</p>
        <h2 className="support-section__title">Un coup de pouce</h2>
        <p className="muted small">
          Paiement sécurisé via Stripe (carte). Choisissez un montant fixe selon votre envie.
        </p>
        <div className="support-donate-grid">
          <article className="support-donate-card">
            <h3>Le grain de sel</h3>
            <p className="support-donate-price">5 €</p>
            <p className="muted small">Pour l’entretien des serveurs et la disponibilité du service.</p>
            <StripeButton href={stripeHref(supportLinks.don5)} priceId={supportPriceIds.don5}>
              Soutenir 5 €
            </StripeButton>
          </article>
          <article className="support-donate-card">
            <h3>Le coup de main</h3>
            <p className="support-donate-price">15 €</p>
            <p className="muted small">Pour financer le développement de nouvelles fonctionnalités.</p>
            <StripeButton href={stripeHref(supportLinks.don15)} priceId={supportPriceIds.don15}>
              Soutenir 15 €
            </StripeButton>
          </article>
          <article className="support-donate-card support-donate-card--featured">
            <h3>Le pilier</h3>
            <p className="support-donate-price">100 €</p>
            <p className="muted small">Pour ceux qui croient fermement à l’autonomie collective.</p>
            <StripeButton
              href={stripeHref(supportLinks.don100)}
              priceId={supportPriceIds.don100}
              className="btn btn-primary"
            >
              Soutenir 100 €
            </StripeButton>
          </article>
        </div>
      </section>

      <section className="card partner-cta partner-cta--featured support-partners-block">
        <div className="support-partners-visual" aria-hidden="true" />
        <div className="support-partners-copy">
          <p className="partner-cta-badge">Partenaires locaux</p>
          <p className="eyebrow">Visibilité sur le réseau</p>
          <h2>Artisans, producteurs, structures engagées</h2>
          <p className="muted">
            Voici les offres Bronze, Argent et Or : visibilité locale, mise en avant sur
            l’accueil, ou partenariat prioraire avec page dédiée, tout en gardant la plateforme
            gratuite pour les troqueurs.
          </p>
          <div className="partner-tiers">
            <article className="partner-tier">
              <h3>Bronze</h3>
              <p>39 EUR / mois</p>
              <ul className="partner-tier-list">
                <li>Visibilité locale : nom + logo page partenaires</li>
                <li>Lien vers votre site ou action locale</li>
              </ul>
              <StripeButton
                href={stripeHref(supportLinks.partnerBronze)}
                priceId={supportPriceIds.partnerBronze}
                className="btn btn-ghost btn-sm"
              >
                Souscrire Bronze
              </StripeButton>
            </article>
            <article className="partner-tier">
              <h3>Argent</h3>
              <p>89 EUR / mois</p>
              <ul className="partner-tier-list">
                <li>Mise en avant sur l’accueil : bannière en rotation</li>
                <li>Logo + lien prioritaire page partenaires</li>
              </ul>
              <StripeButton
                href={stripeHref(supportLinks.partnerSilver)}
                priceId={supportPriceIds.partnerSilver}
                className="btn btn-ghost btn-sm"
              >
                Souscrire Argent
              </StripeButton>
            </article>
            <article className="partner-tier">
              <h3>Or</h3>
              <p>189 EUR / mois</p>
              <ul className="partner-tier-list">
                <li>Partenariat prioritaire : bannière mise en avant</li>
                <li>Votre page personnalisée sur le réseau</li>
              </ul>
              <StripeButton
                href={stripeHref(supportLinks.partnerGold)}
                priceId={supportPriceIds.partnerGold}
                className="btn btn-ghost btn-sm"
              >
                Souscrire Or
              </StripeButton>
            </article>
          </div>
          <p className="small muted support-stripe-hint">
            Paiement sécurisé via notre partenaire STRIPE.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-ghost" to="/informations#partenaires">
              Demande personnalisée (formulaire)
            </Link>
          </div>
        </div>
      </section>

      <section className="card support-section support-faq">
        <p className="eyebrow">Questions fréquentes</p>
        <h2 className="support-section__title">Soutien &amp; dons</h2>
        <div className="support-faq-list">
          <article className="support-faq-item">
            <h3>À quoi sert concrètement mon don ?</h3>
            <p className="muted small">
              L&apos;intégralité des contributions sert à maintenir l&apos;indépendance du réseau.
              Cela finance l&apos;hébergement sécurisé sur Cloudflare, les noms de domaine de nos
              applications (Troc, FreshRescue, etc.) et le développement technique pour améliorer
              les outils de partage.
            </p>
          </article>
          <article className="support-faq-item">
            <h3>Le réseau n&apos;est-il pas gratuit ?</h3>
            <p className="muted small">
              Si, et il le restera. L&apos;accès aux applications de troc et de lutte contre le
              gaspillage est gratuit pour tous les citoyens. Les dons et partenariats permettent
              d&apos;éviter la publicité intrusive et la revente de données personnelles.
            </p>
          </article>
          <article className="support-faq-item">
            <h3>Puis-je arrêter mon soutien mensuel quand je veux ?</h3>
            <p className="muted small">
              Absolument. Pour un soutien ponctuel ou un abonnement partenaire, vous gardez le
              contrôle via Stripe. Il n&apos;y a aucun engagement de durée.
            </p>
          </article>
          <article className="support-faq-item">
            <h3>Je suis professionnel, quel intérêt à devenir partenaire ?</h3>
            <p className="muted small">
              En plus de soutenir une initiative locale, vous gagnez une visibilité ciblée auprès
              d&apos;une communauté engagée dans la consommation responsable et l&apos;autonomie.
              Selon l&apos;offre (Bronze, Argent, Or), votre logo et vos actions locales sont mis en
              avant.
            </p>
          </article>
          <article className="support-faq-item">
            <h3>Mon paiement est-il sécurisé ?</h3>
            <p className="muted small">
              Oui. Nous utilisons Stripe, leader mondial du paiement en ligne. Vos informations
              bancaires ne transitent jamais par nos serveurs et sont chiffrées selon des normes
              de sécurité strictes.
            </p>
          </article>
        </div>
      </section>

      <section className="card support-founder-note">
        <p className="muted">
          Passionné de technique et fort de 28 ans d&apos;expérience dans le développement de
          solutions pratiques, je mets aujourd&apos;hui mes compétences de développeur au service de
          notre autonomie commune. Votre soutien me permet de consacrer le temps nécessaire à la
          maintenance de ces outils complexes.
        </p>
      </section>
    </div>
  )
}
