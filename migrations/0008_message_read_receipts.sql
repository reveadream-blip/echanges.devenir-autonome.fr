-- Dernière consultation du fil par chaque participant (messages entrants non lus après cette date).

ALTER TABLE message_threads ADD COLUMN owner_last_read_at INTEGER;
ALTER TABLE message_threads ADD COLUMN peer_last_read_at INTEGER;
