-- PHASE 2 : Ajout des clés CMS manquantes pour rendre le site 100% éditable
-- Utilise ON CONFLICT pour éviter les erreurs si certaines clés existent déjà

-- Hero Section - Brand name
INSERT INTO site_content (content_key, content_type, content_value, page_section, description)
VALUES 
  ('hero_brand_name', 'text', '"Random"'::jsonb, 'hero', 'Nom de la marque affiché en grand dans le hero')
ON CONFLICT (content_key) DO NOTHING;

-- How It Works - Icônes dynamiques (Lucide icon names)
INSERT INTO site_content (content_key, content_type, content_value, page_section, description)
VALUES 
  ('how_it_works_step_1_icon', 'text', '"HandMetal"'::jsonb, 'how_it_works', 'Nom de l''icône Lucide pour Step 1 (HandMetal, Users, MapPin, Zap, Sparkles, etc.)'),
  ('how_it_works_step_2_icon', 'text', '"Users"'::jsonb, 'how_it_works', 'Nom de l''icône Lucide pour Step 2'),
  ('how_it_works_step_3_icon', 'text', '"MapPin"'::jsonb, 'how_it_works', 'Nom de l''icône Lucide pour Step 3'),
  ('how_it_works_step_4_icon', 'text', '"GlassWater"'::jsonb, 'how_it_works', 'Nom de l''icône Lucide pour Step 4')
ON CONFLICT (content_key) DO NOTHING;

-- Footer - Réseaux sociaux
INSERT INTO site_content (content_key, content_type, content_value, page_section, description)
VALUES 
  ('social_facebook', 'text', '""'::jsonb, 'footer', 'URL de la page Facebook (laisser vide pour masquer l''icône)'),
  ('social_instagram', 'text', '""'::jsonb, 'footer', 'URL de la page Instagram (laisser vide pour masquer l''icône)'),
  ('social_twitter', 'text', '""'::jsonb, 'footer', 'URL de la page Twitter/X (laisser vide pour masquer l''icône)'),
  ('social_linkedin', 'text', '""'::jsonb, 'footer', 'URL de la page LinkedIn (laisser vide pour masquer l''icône)')
ON CONFLICT (content_key) DO NOTHING;