/** Stripe Payment Links / Checkout URLs — définir dans .env (préfixe VITE_) au build. */
const env = import.meta.env

export const supportLinks = {
  don5:
    (env.VITE_STRIPE_DON_5 as string | undefined)?.trim() ||
    'https://buy.stripe.com/4gM9AM1fN6INama5ATcZa0h',
  don15:
    (env.VITE_STRIPE_DON_15 as string | undefined)?.trim() ||
    'https://buy.stripe.com/7sYfZaaQn3wBgKy1kDcZa0j',
  don100:
    (env.VITE_STRIPE_DON_100 as string | undefined)?.trim() ||
    'https://buy.stripe.com/bJe28k7Ebebfcui1kDcZa0i',
  partnerBronze:
    (env.VITE_STRIPE_PARTNER_BRONZE as string | undefined)?.trim() ||
    'https://buy.stripe.com/7sYeV6f6D9UZ1PEd3lcZa0e',
  partnerSilver:
    (env.VITE_STRIPE_PARTNER_SILVER as string | undefined)?.trim() ||
    'https://buy.stripe.com/dRm3co2jR1otdymd3lcZa0f',
  partnerGold:
    (env.VITE_STRIPE_PARTNER_GOLD as string | undefined)?.trim() ||
    'https://buy.stripe.com/7sY7sE9Mjd7bdym0gzcZa0g',
} as const

export const supportPriceIds = {
  don5: 'price_1TV0ZS2OTwAkD5DR9GS9gHPj',
  don15: 'price_1TV0aJ2OTwAkD5DRDrH9A9FZ',
  don100: 'price_1TV0xV2OTwAkD5DRLNlZHzzH',
  partnerBronze: 'price_1TV17W2OTwAkD5DRqbfjL1M2',
  partnerSilver: 'price_1TV17W2OTwAkD5DRY8PNkRDC',
  partnerGold: 'price_1TV17X2OTwAkD5DRelifmpZl',
} as const

export function stripeHref(url: string): string | undefined {
  return /^https?:\/\//i.test(url) ? url : undefined
}
