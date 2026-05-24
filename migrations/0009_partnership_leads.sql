CREATE TABLE partnership_leads (
  id TEXT PRIMARY KEY NOT NULL,
  contact_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT,
  plan_interest TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_partnership_leads_created ON partnership_leads(created_at DESC);
