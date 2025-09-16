-- Créer le cron job avec fréquence de 72h (tous les 3 jours à 4h du matin)
SELECT cron.schedule(
  'cleanup-groups-cron',
  '0 4 */3 * *', -- Tous les 3 jours à 4h du matin (72h)
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/cleanup-groups',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);