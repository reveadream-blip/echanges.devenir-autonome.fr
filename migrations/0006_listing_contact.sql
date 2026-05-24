-- Contact facultatif affiché sur la fiche publique (téléphone / e-mail)

ALTER TABLE food_listings ADD COLUMN contact_phone TEXT;
ALTER TABLE food_listings ADD COLUMN contact_email TEXT;

ALTER TABLE skill_listings ADD COLUMN contact_phone TEXT;
ALTER TABLE skill_listings ADD COLUMN contact_email TEXT;
