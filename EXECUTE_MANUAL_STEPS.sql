-- ============================================================================
-- MANUAL CONFIGURATION STEPS FOR CRM SYSTEM
-- ============================================================================
-- These steps MUST be executed manually in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================
-- SOTA Nov 2025: pg_cron for scheduled jobs, pg_net for HTTP requests
-- Source: https://supabase.com/docs/guides/database/extensions/pg_cron
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- ============================================================================
-- STEP 2: Schedule CRON Job for Zoho Token Refresh
-- ============================================================================
-- Runs every 45 minutes to keep OAuth token fresh (expires after 59min)
-- ============================================================================

SELECT cron.schedule(
  'refresh-zoho-token-worker',
  '*/45 * * * *', -- Every 45 minutes
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/refresh-zoho-token',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verify CRON job is scheduled
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'refresh-zoho-token-worker';

-- Expected output:
-- jobname                      | schedule      | active
-- ---------------------------- | ------------- | ------
-- refresh-zoho-token-worker    | */45 * * * *  | t

-- ============================================================================
-- STEP 3: Schedule CRON Job for Campaign Queue Processing
-- ============================================================================
-- Runs every minute to process pending emails
-- ============================================================================

-- Vérifier si le job existe déjà
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname = 'process-campaign-queue-worker';

-- Si le job n'existe pas, le créer:
SELECT cron.schedule(
  'process-campaign-queue-worker',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-campaign-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Check all CRON jobs
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
ORDER BY jobname;

-- 2. Check recent CRON executions
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- 3. Verify Zoho token exists and is valid
SELECT 
  id,
  created_at,
  expires_at,
  expires_at > NOW() AS is_valid,
  EXTRACT(MINUTE FROM (expires_at - NOW())) AS minutes_until_expiry,
  consecutive_failures,
  circuit_breaker_until
FROM zoho_oauth_tokens
ORDER BY created_at DESC
LIMIT 1;

-- 4. Check campaign queue status
SELECT 
  campaign_id,
  status,
  total_recipients,
  processed,
  failed,
  created_at,
  updated_at
FROM campaign_email_queue
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check DLQ for failed emails
SELECT 
  id,
  campaign_id,
  recipient_email,
  error_type,
  total_attempts,
  final_error,
  moved_to_dlq_at,
  reprocessed
FROM campaign_email_dlq
ORDER BY moved_to_dlq_at DESC
LIMIT 20;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If CRON job is not running, check logs:
SELECT * FROM cron.job_run_details 
WHERE jobname = 'refresh-zoho-token-worker'
ORDER BY start_time DESC 
LIMIT 5;

-- If token refresh fails:
SELECT * FROM zoho_oauth_tokens ORDER BY created_at DESC LIMIT 1;
-- Check consecutive_failures and circuit_breaker_until

-- To manually trigger token refresh:
SELECT net.http_post(
  url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/refresh-zoho-token',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
  body := '{}'::jsonb
);

-- To manually trigger queue processing:
SELECT net.http_post(
  url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-campaign-queue',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
  body := '{}'::jsonb
);

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================

/*
After executing all manual steps, verify:

✅ pg_cron and pg_net extensions are enabled
✅ refresh-zoho-token-worker CRON job is scheduled (*/45 * * * *)
✅ process-campaign-queue-worker CRON job is scheduled (* * * * *)
✅ Zoho token exists in zoho_oauth_tokens with valid expires_at
✅ CRON job executions appear in cron.job_run_details
✅ No errors in cron.job_run_details return_message

Next: Bootstrap Zoho token via Dashboard (PHASE 1 - CRITICAL)
Then: Test end-to-end campaign sending
*/
