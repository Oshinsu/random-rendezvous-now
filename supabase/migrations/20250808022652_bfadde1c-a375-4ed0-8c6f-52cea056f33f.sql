-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Tighten RLS: restrict system-managed policies to service_role
ALTER POLICY "system_can_manage_history" ON public.user_outings_history
USING ((auth.jwt() ->> 'role' = 'service_role'))
WITH CHECK ((auth.jwt() ->> 'role' = 'service_role'));

ALTER POLICY "System can insert outings history with validation" ON public.user_outings_history
WITH CHECK (
  (auth.jwt() ->> 'role' = 'service_role')
  AND (participants_count > 0)
  AND (participants_count <= 5)
  AND (length(TRIM(BOTH FROM bar_name)) > 0)
  AND (length(TRIM(BOTH FROM bar_address)) > 0)
);

ALTER POLICY "system_can_manage_bar_ratings" ON public.bar_ratings
USING ((auth.jwt() ->> 'role' = 'service_role'))
WITH CHECK ((auth.jwt() ->> 'role' = 'service_role'));

ALTER POLICY "system_can_send_messages_v2" ON public.group_messages
WITH CHECK ((is_system = true) AND (auth.jwt() ->> 'role' = 'service_role'));

-- Schedule the scheduled-group-activation-cron edge function every 2 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'activate-scheduled-groups-every-2-min') THEN
    PERFORM cron.unschedule('activate-scheduled-groups-every-2-min');
  END IF;
END$$;

SELECT
  cron.schedule(
    'activate-scheduled-groups-every-2-min',
    '*/2 * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/scheduled-group-activation-cron',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
        body := jsonb_build_object('invoked_at', now())
      ) as request_id;
    $$
  );