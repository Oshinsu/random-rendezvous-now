-- Supprimer l'ancien cron job cleanup-groups-cron qui s'exécute toutes les 30 minutes
SELECT cron.unschedule('cleanup-groups-cron') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-groups-cron' AND schedule = '*/30 * * * *'
);