-- Set up a cron job to activate scheduled groups every 5 minutes
SELECT cron.schedule(
  'activate-scheduled-groups-every-5min',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/scheduled-group-activation-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);