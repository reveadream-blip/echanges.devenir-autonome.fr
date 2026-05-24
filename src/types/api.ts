export type AuthUser = {
  id: string
  email: string
  display_name: string
  verified: number
}

export type FoodListingPublic = {
  id: string
  category: string
  title: string
  description: string
  exchange: string
  resilience_points: number | null
  approx_lat: number
  approx_lng: number
  zone_label: string
  author_name: string
  created_at: number
  /** Data URL ; absent ou null si pas de photo déposée. */
  photo_url?: string | null
  /** Présent quand vous êtes connecté·e : votre annonce. */
  mine?: boolean
  /** Facultatif — affiché uniquement si l’auteur les renseigne. */
  contact_phone?: string | null
  contact_email?: string | null
}

/** Détail propriétaire pour édition (coords précises). */
export type FoodListingEditable = {
  id: string
  category: string
  title: string
  description: string
  exchange: string
  resilience_points: number | null
  lat: number
  lng: number
  created_at: number
  photo_url: string | null
  contact_phone?: string | null
  contact_email?: string | null
}

export type SkillListingPublic = {
  id: string
  title: string
  offer: string
  hoping_for: string
  approx_lat: number
  approx_lng: number
  zone_label: string
  author_name: string
  created_at: number
  photo_url?: string | null
  mine?: boolean
  contact_phone?: string | null
  contact_email?: string | null
}

export type SkillListingEditable = {
  id: string
  title: string
  offer: string
  hoping_for: string
  lat: number
  lng: number
  created_at: number
  photo_url: string | null
  contact_phone?: string | null
  contact_email?: string | null
}

export type MapMarker = {
  kind: 'food' | 'skill'
  id: string
  label: string
  approx_lat: number
  approx_lng: number
  radius_m: number
  zone_label: string
  category?: string
}

export type ExchangeThreadSummary = {
  id: string
  listing_kind: 'food' | 'skill'
  listing_id: string
  listing_title: string
  counterpart_name: string
  listing_path: string
  last_preview: string | null
  last_message_at: number | null
  updated_at: number
  has_unread?: boolean
}

export type ExchangeThreadDetail = {
  id: string
  listing_kind: 'food' | 'skill'
  listing_id: string
  listing_title: string
  counterpart_name: string
  listing_path: string
}

export type ExchangeMessage = {
  id: string
  sender_id: string
  body: string
  created_at: number
}

export type AdminOverviewCounts = {
  users: number
  food_listings: number
  skill_listings: number
  newsletter_subscribers: number
  partnership_leads: number
}

export type AdminOverviewStats = {
  verified_users: number
  verification_rate_pct: number
  new_users_7d: number
  new_food_7d: number
  new_skills_7d: number
  new_newsletter_7d: number
  new_partnerships_7d: number
  message_threads: number
  messages_total: number
  avg_messages_per_thread: number
  month_label: string
  new_users_month: number
  new_food_month: number
  new_skills_month: number
  new_newsletter_month: number
  new_partnerships_month: number
  partner_revenue_monthly_estimate: number
}

export type AdminNewsletterSubscriber = {
  id: string
  email: string
  created_at: number
}

export type AdminPartnershipLead = {
  id: string
  contact_name: string
  organization: string
  email: string
  phone: string | null
  plan_interest: string
  message: string
  created_at: number
}

/** Ligne issue du webhook Stripe (dons, abonnements partenaires, renouvellements). */
export type AdminSupportPayment = {
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

export type AdminUserRow = {
  id: string
  email: string
  display_name: string
  verified: number
  created_at: number
}

export type AdminListingRow = {
  id: string
  title: string
  created_at: number
  user_id: string | null
}
