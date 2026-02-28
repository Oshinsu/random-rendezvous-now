-- =====================================================================
-- URGENCE : Réduction des crons surconsommateurs
-- 226 159 REST requests / 24h → EXCEEDING USAGE LIMITS
-- Appliqué directement via MCP SQL le 2026-02-27
-- =====================================================================

-- 1. process-campaign-queue : toutes les 1 minute → toutes les 5 minutes
--    Économie : 1 152 triggers/jour → 288 triggers/jour (-80%)
--    NOTE: job 17 (owned by supabase_read_only_user) nécessite fix manuel
--    via Supabase Dashboard → Database → Cron Jobs → job 17 → edit schedule → */5 * * * *

-- Mettre à jour la fonction de reschedule pour utiliser 5 minutes dorénavant
CREATE OR REPLACE FUNCTION schedule_campaign_queue_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $func$
BEGIN
  PERFORM cron.schedule(
    'process-campaign-queue-worker',
    '*/5 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-campaign-queue',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
    $cron$
  );
END;
$func$;

-- 2. Supprimer le doublon cleanup-groups/30min (déjà appliqué via MCP)
-- cleanup-groups-cron-6h (0 */6 * * *) est suffisant

-- 3. Reschedule health scores de 1h -> 4h (déjà appliqué via MCP)
-- Nouveau job : calculate-crm-health-every-4h (0 */4 * * *)
