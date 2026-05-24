-- Paiements Stripe (dons ponctuels, abonnements partenaires, renouvellements) — alimenté par POST /api/stripe/webhook

CREATE TABLE support_stripe_events (
  id TEXT PRIMARY KEY NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL,
  amount_total INTEGER,
  currency TEXT NOT NULL DEFAULT 'eur',
  customer_email TEXT,
  payment_status TEXT,
  checkout_mode TEXT,
  stripe_session_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  label TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_support_stripe_events_created ON support_stripe_events (created_at DESC);
