-- Réinsérer les clés hero manquantes qui sont utilisées dans le code
-- Le content_value est de type jsonb, donc on doit wrapper les strings en JSON
INSERT INTO site_content (content_key, content_type, content_value, page_section, description)
VALUES 
  ('hero_background_image_url', 'image', '"/src/assets/hero-banner.png"'::jsonb, 'hero', 'Image de fond de la section hero'),
  ('hero_title', 'text', '"1 clic. 1 groupe. 1 bar."'::jsonb, 'hero', 'Titre principal en français'),
  ('hero_title_en', 'text', '"1 click. 1 group. 1 bar."'::jsonb, 'hero', 'Titre principal en anglais')
ON CONFLICT (content_key) DO NOTHING;