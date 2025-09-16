-- Supprimer l'ancien cron job s'il existe
SELECT cron.unschedule('cleanup-groups-cron');

-- Créer le nouveau cron job avec fréquence de 72h (tous les 3 jours à 4h du matin)
SELECT cron.schedule(
  'cleanup-groups-cron',
  '0 4 */3 * *', -- Tous les 3 jours à 4h du matin (72h)
  $$
  SELECT net.http_post(
    url := 'https://xbuckyaxqzqjldcyszdwz.supabase.co/functions/v1/cleanup-groups',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidWNreWF4cXpxamxkY3lzemR3eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI5OTU4OTkzLCJleHAiOjIwNDU1MzQ5OTN9.ixCdU9A5OYrPLN5GrNqeRn_Y4qWXelrFr-mUKqz1F3s"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);