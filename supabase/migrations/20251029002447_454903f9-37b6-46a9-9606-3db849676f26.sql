-- ============================================================================
-- PHASE 1: Triggers Temps Réel pour lifecycle_change et segment_entry
-- ============================================================================

-- Modifier le trigger existant pour invoquer la edge function lifecycle-automations
CREATE OR REPLACE FUNCTION public.trigger_lifecycle_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process on stage changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id) THEN
    -- Appeler la edge function lifecycle-automations via HTTP
    PERFORM net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/lifecycle-automations',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
      ),
      body := jsonb_build_object(
        'userId', NEW.user_id,
        'lifecycleStageId', NEW.stage_id,
        'previousStageId', OLD.stage_id,
        'triggerType', 'lifecycle_change'
      )
    );
    
    -- Toujours logger dans audit_log pour traçabilité
    INSERT INTO admin_audit_log (admin_user_id, action_type, table_name, record_id, metadata)
    VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'lifecycle_automation_triggered',
      'crm_user_lifecycle',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'new_stage_id', NEW.stage_id,
        'old_stage_id', OLD.stage_id,
        'trigger_method', 'real_time_sql_trigger'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer trigger pour segment_entry
CREATE OR REPLACE FUNCTION public.trigger_segment_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Appeler lifecycle-automations pour segment_entry
  PERFORM net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/lifecycle-automations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'segmentId', NEW.segment_id,
      'triggerType', 'segment_entry'
    )
  );
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur crm_user_segment_memberships
DROP TRIGGER IF EXISTS segment_entry_automation_trigger ON crm_user_segment_memberships;
CREATE TRIGGER segment_entry_automation_trigger
AFTER INSERT ON crm_user_segment_memberships
FOR EACH ROW
EXECUTE FUNCTION trigger_segment_automation();

-- ============================================================================
-- PHASE 3: Table scheduled_sends pour gestion des délais
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_scheduled_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES crm_automation_rules(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_scheduled_sends_scheduled_for ON public.crm_scheduled_sends(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scheduled_sends_user_id ON public.crm_scheduled_sends(user_id);
CREATE INDEX idx_scheduled_sends_status ON public.crm_scheduled_sends(status);

-- RLS policies
ALTER TABLE public.crm_scheduled_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scheduled sends"
ON public.crm_scheduled_sends FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage scheduled sends"
ON public.crm_scheduled_sends FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- PHASE 5: Table automation_executions pour monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES crm_automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger_type TEXT NOT NULL,
  campaign_sent BOOLEAN DEFAULT false,
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  send_status TEXT,
  channels JSONB DEFAULT '[]'::jsonb,
  delay_applied_minutes INTEGER DEFAULT 0,
  scheduled_send_id UUID REFERENCES crm_scheduled_sends(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE INDEX idx_automation_executions_rule_id ON public.crm_automation_executions(rule_id);
CREATE INDEX idx_automation_executions_user_id ON public.crm_automation_executions(user_id);
CREATE INDEX idx_automation_executions_triggered_at ON public.crm_automation_executions(triggered_at DESC);

-- RLS policies
ALTER TABLE public.crm_automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automation executions"
ON public.crm_automation_executions FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage automation executions"
ON public.crm_automation_executions FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- ============================================================================
-- PHASE 2 & 4: Cron Jobs
-- ============================================================================

-- Cron job quotidien pour check inactive users (9h du matin)
SELECT cron.schedule(
  'check-lifecycle-automations-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/check-inactive-users',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"scheduled": true, "source": "daily_cron"}'::jsonb
  ) as request_id;
  $$
);

-- Cron job pour process scheduled sends (toutes les 15 minutes)
SELECT cron.schedule(
  'process-scheduled-sends',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-scheduled-sends',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- Cron jobs pour peak hours nudge (Jeudi/Vendredi/Samedi à 18h00)
SELECT cron.schedule(
  'peak-hours-nudge-thursday',
  '0 18 * * 4',
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-peak-hours-nudge',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"day": "thursday", "hour": 18}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'peak-hours-nudge-friday',
  '0 18 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-peak-hours-nudge',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"day": "friday", "hour": 18}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'peak-hours-nudge-saturday',
  '0 18 * * 6',
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-peak-hours-nudge',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"day": "saturday", "hour": 18}'::jsonb
  ) as request_id;
  $$
);