-- Phase 2: Lifecycle Automation Rules
CREATE TABLE IF NOT EXISTS public.crm_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('lifecycle_change', 'segment_entry', 'health_threshold', 'inactivity')),
  trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Phase 3: Unsubscribe Management (RGPD compliant)
CREATE TABLE IF NOT EXISTS public.crm_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push', 'sms', 'all')),
  reason TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, channel)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_active 
ON public.crm_automation_rules(is_active, trigger_type) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_unsubscribes_user_channel 
ON public.crm_unsubscribes(user_id, channel);

CREATE INDEX IF NOT EXISTS idx_campaigns_status_sendat 
ON public.crm_campaigns(status, send_at) 
WHERE status = 'scheduled';

-- RLS Policies
ALTER TABLE public.crm_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation rules" 
ON public.crm_automation_rules 
FOR ALL 
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage automation rules" 
ON public.crm_automation_rules 
FOR ALL 
TO service_role
USING (true);

CREATE POLICY "Users can unsubscribe" 
ON public.crm_unsubscribes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their unsubscribes" 
ON public.crm_unsubscribes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all unsubscribes" 
ON public.crm_unsubscribes 
FOR SELECT 
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage unsubscribes" 
ON public.crm_unsubscribes 
FOR ALL 
TO service_role
USING (true);

-- Trigger function for automation rules
CREATE OR REPLACE FUNCTION public.trigger_lifecycle_automation()
RETURNS TRIGGER AS $$
DECLARE
  matching_rule RECORD;
BEGIN
  -- Only process on stage changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id) THEN
    -- Find matching active automation rules
    FOR matching_rule IN
      SELECT * FROM crm_automation_rules
      WHERE is_active = true
      AND trigger_type = 'lifecycle_change'
      AND (
        trigger_condition->>'to_stage_id' = NEW.stage_id::text
        OR trigger_condition->>'from_stage_id' = OLD.stage_id::text
      )
      ORDER BY priority DESC
    LOOP
      -- Log the automation trigger (could invoke edge function here)
      INSERT INTO admin_audit_log (admin_user_id, action_type, table_name, record_id, metadata)
      VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        'lifecycle_automation_triggered',
        'crm_user_lifecycle',
        NEW.id,
        jsonb_build_object(
          'rule_id', matching_rule.id,
          'rule_name', matching_rule.rule_name,
          'user_id', NEW.user_id,
          'delay_minutes', matching_rule.delay_minutes
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS lifecycle_automation_trigger ON crm_user_lifecycle;
CREATE TRIGGER lifecycle_automation_trigger
AFTER INSERT OR UPDATE ON crm_user_lifecycle
FOR EACH ROW
EXECUTE FUNCTION trigger_lifecycle_automation();