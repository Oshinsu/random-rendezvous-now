-- Correction finale : 2 jours + nouveaux keywords

-- 1. Mettre à jour fréquence
UPDATE blog_generation_schedule SET frequency_days = 2 WHERE id IS NOT NULL;

-- 2. Recréer le cron avec 2 jours
DO $$
BEGIN
  -- Supprimer le cron s'il existe
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-generate-blog-article') THEN
    PERFORM cron.unschedule('auto-generate-blog-article');
  END IF;
  
  -- Créer le nouveau cron (tous les 2 jours)
  PERFORM cron.schedule(
    'auto-generate-blog-article',
    '0 9 */2 * *',
    'SELECT trigger_blog_generation();'
  );
END $$;

-- 3. Ajouter HEAD TERMS + MIDDLE TAIL + SUJETS PROFONDS
INSERT INTO blog_keywords (keyword, priority, status, notes) VALUES
('Random Paris', 10, 'active', 'Branded head term'),
('rencontres Paris', 10, 'active', 'Head générique'),
('sortir Paris', 10, 'active', 'Head lifestyle'),
('bars Paris', 9, 'active', 'Head commercial'),
('amis Paris', 9, 'active', 'Head social'),
('rencontres spontanées', 9, 'active', 'Middle USP'),
('faire des rencontres', 8, 'active', 'Middle générique'),
('sortir seul', 8, 'active', 'Middle pain'),
('nouveaux amis', 8, 'active', 'Middle objectif'),
('liens faibles sociologie', 9, 'active', 'Middle académique'),
('capital social', 8, 'active', 'Middle socio'),
('anxiété sociale', 8, 'active', 'Middle psycho'),
('économie locale bars', 7, 'active', 'Middle économique'),
('théorie liens faibles Granovetter', 9, 'active', 'Granovetter 1973'),
('solitude urbaine Paris', 8, 'active', 'Sociétal'),
('atomisation sociale millenials', 8, 'active', 'Socio génération'),
('économie collaborative bars', 7, 'active', 'Économique'),
('sérendipité sociale', 8, 'active', 'Psycho hasard'),
('capital social bridging', 8, 'active', 'Putnam 2000'),
('mobilité sociale rencontres', 7, 'active', 'Socio ascension'),
('bien-être social connections', 8, 'active', 'Psycho santé'),
('urbanisme rencontres', 7, 'active', 'Sociétal aménagement'),
('tiers-lieux Paris', 7, 'active', 'Oldenburg 1989')
ON CONFLICT (keyword) DO NOTHING;