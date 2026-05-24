/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** URL canonique du site (sans slash final). Ex. https://echanges.devenirautonome.fr */
  readonly VITE_PUBLIC_SITE_URL?: string
  /** Code Google Search Console (balise meta google-site-verification) */
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_STRIPE_DON_5?: string
  readonly VITE_STRIPE_DON_15?: string
  readonly VITE_STRIPE_DON_100?: string
  readonly VITE_STRIPE_PARTNER_BRONZE?: string
  readonly VITE_STRIPE_PARTNER_SILVER?: string
  readonly VITE_STRIPE_PARTNER_GOLD?: string
}
