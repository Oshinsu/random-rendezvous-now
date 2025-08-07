-- Enable required extensions (safe if already installed)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recreate missing triggers safely
-- GROUPS triggers
DROP TRIGGER IF EXISTS tg_set_completed_at ON public.groups;
CREATE TRIGGER tg_set_completed_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_completed_at();

DROP TRIGGER IF EXISTS tg_add_to_outings_history ON public.groups;
CREATE TRIGGER tg_add_to_outings_history
AFTER UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.add_to_outings_history();

DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;
CREATE TRIGGER tg_trigger_auto_bar_assignment
AFTER UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_bar_assignment();

DROP TRIGGER IF EXISTS tg_auto_cleanup_on_group_operations ON public.groups;
CREATE TRIGGER tg_auto_cleanup_on_group_operations
AFTER INSERT OR UPDATE OR DELETE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.auto_cleanup_on_group_operations();

-- GROUP PARTICIPANTS triggers
DROP TRIGGER IF EXISTS tg_group_participant_changes ON public.group_participants;
CREATE TRIGGER tg_group_participant_changes
AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_group_participant_changes();

-- GROUP MESSAGES triggers
DROP TRIGGER IF EXISTS tg_validate_message_before_insert ON public.group_messages;
CREATE TRIGGER tg_validate_message_before_insert
BEFORE INSERT ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_before_insert();

DROP TRIGGER IF EXISTS tg_update_participant_last_seen ON public.group_messages;
CREATE TRIGGER tg_update_participant_last_seen
AFTER INSERT ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_participant_last_seen();

-- USER OUTINGS HISTORY triggers (bar ratings aggregation)
DROP TRIGGER IF EXISTS tg_update_bar_rating ON public.user_outings_history;
CREATE TRIGGER tg_update_bar_rating
AFTER UPDATE OF user_rating ON public.user_outings_history
FOR EACH ROW
EXECUTE FUNCTION public.update_bar_rating();

-- One-time backfill/repair (safe no-op if nothing missing)
SELECT public.repair_missing_outings_history();

-- Fix cron job: unschedule existing (if any) and reschedule with correct schema
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-groups-every-10-min') THEN
    PERFORM cron.unschedule('cleanup-groups-every-10-min');
  END IF;
END$$;

SELECT
  cron.schedule(
    'cleanup-groups-every-10-min',
    '*/10 * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/cleanup-groups',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
        body := jsonb_build_object('invoked_at', now())
      ) as request_id;
    $$
  );