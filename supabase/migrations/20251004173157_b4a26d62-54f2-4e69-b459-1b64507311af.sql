-- ============================================================================
-- PHASE 5: Augmentation de la fréquence du cron cleanup (6 heures)
-- Pour une réconciliation plus rapide entre frontend et backend
-- ============================================================================

-- Supprimer l'ancien cron job (fréquence 72h)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-groups-cron') THEN
    PERFORM cron.unschedule('cleanup-groups-cron');
    RAISE NOTICE 'Ancien cron job (72h) supprimé';
  END IF;
END$$;

-- Créer le nouveau cron job avec fréquence de 6 heures
SELECT cron.schedule(
  'cleanup-groups-cron-6h',
  '0 */6 * * *', -- Toutes les 6 heures (à 00:00, 06:00, 12:00, 18:00)
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/cleanup-groups',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- Vérifier que le cron est bien créé
DO $$
DECLARE
  job_count integer;
BEGIN
  SELECT COUNT(*) INTO job_count
  FROM cron.job 
  WHERE jobname = 'cleanup-groups-cron-6h';
  
  IF job_count = 1 THEN
    RAISE NOTICE '✅ Nouveau cron job créé avec succès (fréquence 6h)';
  ELSE
    RAISE NOTICE '❌ Erreur création cron job';
  END IF;
END$$;