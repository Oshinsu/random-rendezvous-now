-- Function to unschedule campaign queue CRON
CREATE OR REPLACE FUNCTION unschedule_campaign_queue_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cron.unschedule('process-campaign-queue-worker');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CRON job may not exist: %', SQLERRM;
END;
$$;

-- Function to schedule campaign queue CRON
CREATE OR REPLACE FUNCTION schedule_campaign_queue_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  PERFORM cron.schedule(
    'process-campaign-queue-worker',
    '* * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-campaign-queue',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb
    ) as request_id;
    $cron$
  );
END;
$func$;