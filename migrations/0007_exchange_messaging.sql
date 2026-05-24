-- Conversations liées à une annonce (troc ou compétence), une ligne par paire (auteur ↔ contact).

ALTER TABLE message_threads ADD COLUMN listing_kind TEXT;
ALTER TABLE message_threads ADD COLUMN listing_id TEXT;
ALTER TABLE message_threads ADD COLUMN owner_user_id TEXT;
ALTER TABLE message_threads ADD COLUMN peer_user_id TEXT;
ALTER TABLE message_threads ADD COLUMN updated_at INTEGER;

CREATE UNIQUE INDEX idx_message_threads_listing_peer
ON message_threads (listing_kind, listing_id, peer_user_id)
WHERE listing_kind IS NOT NULL
  AND listing_id IS NOT NULL
  AND peer_user_id IS NOT NULL;

CREATE INDEX idx_messages_thread_created ON messages (thread_id, created_at);
