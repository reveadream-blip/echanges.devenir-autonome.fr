-- Photo optionnelle par annonce (JPEG/PNG/WebP, payload contrôlé côté API)

ALTER TABLE food_listings ADD COLUMN photo_mime TEXT;
ALTER TABLE food_listings ADD COLUMN photo_data TEXT;

ALTER TABLE skill_listings ADD COLUMN photo_mime TEXT;
ALTER TABLE skill_listings ADD COLUMN photo_data TEXT;
