-- Seed 50 SEO Keywords for Blog Automation
-- Phase 3: Keywords Pool pour éviter la cannibalisation

-- Nettoyer les anciens keywords de test si nécessaire
DELETE FROM blog_keywords WHERE keyword = 'Rencontres amicales' AND notes = 'Initial test keyword';

-- CATÉGORIE 1 : RENCONTRES/SOCIAL (Priorité 8-10)
INSERT INTO blog_keywords (keyword, priority, status, notes) VALUES
('rencontrer de nouvelles personnes à Paris', 10, 'active', 'High intent, volume élevé'),
('faire des rencontres amicales à Paris', 10, 'active', 'Long-tail, conversion élevée'),
('sortir seul à Paris sans être seul', 9, 'active', 'Pain point majeur'),
('trouver des amis à Paris après 25 ans', 9, 'active', 'Question fréquente'),
('rencontres entre jeunes actifs Paris', 8, 'active', 'Cible précise'),
('comment se faire des amis à Paris', 9, 'active', 'Informationnel, fort volume'),
('sorties entre célibataires Paris', 8, 'active', 'Ambigu (dating vs amical)'),
('groupe de sortie Paris', 8, 'active', 'Commercial intent'),
('activités sociales Paris 20-35 ans', 7, 'active', 'Âge cible'),
('rencontres spontanées Paris', 8, 'active', 'USP Random'),
('sortir de sa zone de confort Paris', 7, 'active', 'Psychologique'),
('faire des connaissances à Paris', 8, 'active', 'Synonyme softer'),
('app rencontres amicales Paris', 9, 'active', 'Branded/competitor'),
('où sortir seul Paris', 9, 'active', 'Géolocalisé'),
('bar pour rencontrer des gens Paris', 9, 'active', 'Commercial + géo')
ON CONFLICT (keyword) DO NOTHING;

-- CATÉGORIE 2 : BARS/SORTIES PARIS (Priorité 6-9)
INSERT INTO blog_keywords (keyword, priority, status, notes) VALUES
('meilleurs bars pour sortir entre amis Paris', 9, 'active', 'Transactionnel'),
('bars sympas Paris pour se rencontrer', 8, 'active', 'Long-tail'),
('où boire un verre seul à Paris', 8, 'active', 'Pain point'),
('bars animés Paris en semaine', 7, 'active', 'Temporel'),
('sorties jeudi soir Paris', 7, 'active', 'Peak hours Random'),
('bars Marais pour rencontrer', 8, 'active', 'Quartier populaire'),
('bars Oberkampf ambiance jeune', 7, 'active', 'Quartier tendance'),
('bars République sortie groupe', 7, 'active', 'Quartier central'),
('meilleurs bars after-work Paris', 8, 'active', 'Timing pro'),
('bars pas chers Paris étudiants', 6, 'active', 'Budget'),
('bars avec terrasse Paris été', 6, 'active', 'Saisonnier'),
('bars cocktails Paris rencontres', 7, 'active', 'Type de bar'),
('bars concerts live Paris', 6, 'active', 'Activité'),
('bars jeux de société Paris', 6, 'active', 'Niche'),
('happy hour bars Paris', 7, 'active', 'Commercial')
ON CONFLICT (keyword) DO NOTHING;

-- CATÉGORIE 3 : LIFESTYLE/CONSEILS (Priorité 5-8)
INSERT INTO blog_keywords (keyword, priority, status, notes) VALUES
('vie sociale après 30 ans Paris', 8, 'active', 'Âge + problème'),
('se sentir seul à Paris que faire', 8, 'active', 'Émotionnel fort'),
('sortir sans planning Paris', 7, 'active', 'USP spontanéité'),
('activités spontanées Paris', 7, 'active', 'Synonyme'),
('briser la routine à Paris', 6, 'active', 'Lifestyle'),
('vie nocturne Paris conseils', 7, 'active', 'Informationnel'),
('premier date bar Paris', 6, 'active', 'Dating adjacent'),
('sortir Paris sans dépenser', 6, 'active', 'Budget'),
('Paris activités solo', 7, 'active', 'Solo travel'),
('rencontrer du monde télétravail Paris', 7, 'active', 'Post-COVID')
ON CONFLICT (keyword) DO NOTHING;

-- CATÉGORIE 4 : PROBLÈMES UTILISATEURS (Priorité 7-9)
INSERT INTO blog_keywords (keyword, priority, status, notes) VALUES
('nouveau à Paris comment rencontrer', 9, 'active', 'Newcomer pain'),
('timide comment sortir à Paris', 8, 'active', 'Barrière psychologique'),
('pas d amis à Paris solutions', 9, 'active', 'Pain point direct'),
('sortir seul Paris angoisse', 8, 'active', 'Anxiété sociale'),
('difficulté rencontrer adulte Paris', 8, 'active', 'Âge adulte'),
('Paris ville anonyme rencontres', 7, 'active', 'Urbanité'),
('expatrié Paris vie sociale', 7, 'active', 'Expat'),
('comment être moins seul Paris', 8, 'active', 'Solitude'),
('Paris sortir sans connaître personne', 9, 'active', 'Zero friend'),
('refaire sa vie sociale Paris', 8, 'active', 'Reboot social')
ON CONFLICT (keyword) DO NOTHING;

-- Mettre à jour les notes admin
INSERT INTO admin_audit_log (admin_user_id, action_type, table_name, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'blog_keywords_seed',
  'blog_keywords',
  jsonb_build_object(
    'total_keywords', 50,
    'categories', jsonb_build_array('rencontres', 'bars', 'lifestyle', 'problemes'),
    'seeded_at', NOW(),
    'note', 'SOTA 2025 keyword pool for automated blog generation'
  )
);

-- Afficher le résultat
DO $$
DECLARE
  keyword_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO keyword_count FROM blog_keywords WHERE status = 'active';
  RAISE NOTICE 'Blog keywords seeded successfully. Total active keywords: %', keyword_count;
END $$;