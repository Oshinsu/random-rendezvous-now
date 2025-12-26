-- =========================================
-- SEED CMS CONTENT WITH LANDING PAGE TEXT
-- =========================================
-- Run this SQL in Supabase SQL Editor to populate site_content with actual landing page values

-- Hero Section
INSERT INTO site_content (content_key, content_type, content_value, page_section, description)
VALUES 
  ('hero_title', 'text', '1 clic. 1 groupe. 1 bar.', 'hero', 'Titre principal Hero section'),
  ('hero_title_en', 'text', '1 click. 1 group. 1 bar.', 'hero', 'Hero title English version'),
  ('hero_cta_text', 'text', 'Tenter l''Aventure', 'hero', 'Texte CTA principal'),
  ('hero_cta_text_logged', 'text', 'Chercher un groupe', 'hero', 'Texte CTA pour utilisateurs connectés'),
  
  -- Benefits Section
  ('benefits_section_title', 'text', 'Pourquoi Random ?', 'benefits', 'Titre de la section bénéfices'),
  ('benefit_1_title', 'text', 'Des rencontres authentiques', 'benefits', 'Titre bénéfice 1'),
  ('benefit_1_description', 'text', 'Finis les swipes infinis et les conversations qui mènent nulle part. Avec Random, chaque sortie est une vraie rencontre, face à face, autour d''un verre.', 'benefits', 'Description bénéfice 1'),
  ('benefit_1_image_url', 'image', '/src/assets/new-benefit-1.jpg', 'benefits', 'Image bénéfice 1'),
  
  ('benefit_2_title', 'text', 'Zéro prise de tête', 'benefits', 'Titre bénéfice 2'),
  ('benefit_2_description', 'text', 'Plus besoin d''organiser, de choisir le lieu ou de coordonner les agendas. Random s''occupe de tout : le groupe, l''heure, le bar.', 'benefits', 'Description bénéfice 2'),
  ('benefit_2_image_url', 'image', '/src/assets/new-benefit-2.jpg', 'benefits', 'Image bénéfice 2'),
  
  ('benefit_3_title', 'text', 'Sors de ta bulle', 'benefits', 'Titre bénéfice 3'),
  ('benefit_3_description', 'text', 'Élargis ton cercle social sans effort. Random te fait découvrir des personnes que tu n''aurais jamais croisées autrement.', 'benefits', 'Description bénéfice 3'),
  ('benefit_3_image_url', 'image', '/src/assets/new-benefit-3.jpg', 'benefits', 'Image bénéfice 3'),
  
  ('benefit_4_title', 'text', 'Des soirées spontanées', 'benefits', 'Titre bénéfice 4'),
  ('benefit_4_description', 'text', 'Un clic suffit pour transformer ta soirée. Parfait pour les moments où tu veux sortir sans savoir où ni avec qui.', 'benefits', 'Description bénéfice 4'),
  ('benefit_4_image_url', 'image', '/src/assets/new-benefit-4.jpg', 'benefits', 'Image bénéfice 4'),
  
  -- How It Works Section
  ('how_it_works_title', 'text', 'Comment ça marche avec Random ?', 'how_it_works', 'Titre section Comment ça marche'),
  ('how_it_works_subtitle', 'text', 'Quatre étapes pour une soirée inoubliable', 'how_it_works', 'Sous-titre section'),
  
  ('how_it_works_step1_title', 'text', 'Tu cliques', 'how_it_works', 'Titre étape 1'),
  ('how_it_works_step1_desc', 'text', 'Un simple clic et Random s''occupe de tout. Pas besoin de créer un profil compliqué ou de remplir des questionnaires interminables.', 'how_it_works', 'Description étape 1'),
  
  ('how_it_works_step2_title', 'text', 'On matche un groupe', 'how_it_works', 'Titre étape 2'),
  ('how_it_works_step2_desc', 'text', 'Notre algorithme crée un groupe équilibré de 4-5 personnes qui ont envie de sortir au même moment. Hommes, femmes, tous motivés pour passer une bonne soirée.', 'how_it_works', 'Description étape 2'),
  
  ('how_it_works_step3_title', 'text', 'On trouve le bar parfait', 'how_it_works', 'Titre étape 3'),
  ('how_it_works_step3_desc', 'text', 'Random sélectionne un bar cool, équidistant de tous les participants. Le lieu idéal pour votre rencontre, choisi pour vous.', 'how_it_works', 'Description étape 3'),
  
  ('how_it_works_step4_title', 'text', 'Tu profites', 'how_it_works', 'Titre étape 4'),
  ('how_it_works_step4_desc', 'text', 'Rendez-vous au bar à l''heure indiquée et vis une soirée authentique. Pas de pression, juste de bonnes vibes et de nouvelles têtes.', 'how_it_works', 'Description étape 4'),
  
  -- CTA Section
  ('cta_title', 'text', 'Prêt pour ta prochaine aventure ?', 'cta', 'Titre section CTA finale'),
  ('cta_subtitle', 'text', 'Rejoins Random : 1 clic, 1 groupe, 1 bar. Des rencontres vraies près de toi.', 'cta', 'Sous-titre CTA'),
  ('cta_button_text', 'text', 'Lancer Random', 'cta', 'Texte bouton CTA final'),
  ('cta_button_text_logged', 'text', 'Chercher un groupe', 'cta', 'Texte bouton pour utilisateurs connectés'),
  
  -- Footer
  ('footer_tagline', 'text', 'Fait avec ❤️ à Paris', 'footer', 'Tagline footer'),
  ('footer_description', 'text', 'Random - L''application qui révolutionne vos sorties', 'footer', 'Description footer'),
  ('contact_email', 'text', 'contact@random-app.fr', 'footer', 'Email de contact')

ON CONFLICT (content_key) DO NOTHING;
