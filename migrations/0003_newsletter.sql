CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_newsletter_created ON newsletter_subscribers(created_at DESC);
