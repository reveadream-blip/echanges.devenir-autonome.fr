-- Troc et Survie — schéma D1 (Cloudflare)

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE food_listings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  exchange TEXT NOT NULL,
  resilience_points INTEGER,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_food_category ON food_listings(category);
CREATE INDEX idx_food_created ON food_listings(created_at DESC);

CREATE TABLE skill_listings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  offer TEXT NOT NULL,
  hoping_for TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_skill_created ON skill_listings(created_at DESC);

-- Messagerie privée (structure minimale pour évolutions futures)
CREATE TABLE message_threads (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY NOT NULL,
  thread_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
