-- Add sequences tables for multi-step campaigns
CREATE TABLE IF NOT EXISTS crm_campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_name TEXT NOT NULL,
  target_segment_id UUID REFERENCES crm_user_segments(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'lifecycle', 'segment', 'behavior')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS crm_campaign_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_campaign_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0 CHECK (delay_hours >= 0),
  condition JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- Add recurring campaign fields
ALTER TABLE crm_campaigns 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB DEFAULT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_segment ON crm_campaign_sequences(target_segment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_active ON crm_campaign_sequences(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON crm_campaign_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_recurring ON crm_campaigns(is_recurring) WHERE is_recurring = true;

-- RLS Policies for sequences
ALTER TABLE crm_campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaign_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sequences"
  ON crm_campaign_sequences
  FOR ALL
  USING (is_admin_user());

CREATE POLICY "Admins can manage sequence steps"
  ON crm_campaign_sequence_steps
  FOR ALL
  USING (is_admin_user());

-- Comment
COMMENT ON TABLE crm_campaign_sequences IS 'Multi-step campaign sequences (drip campaigns)';
COMMENT ON TABLE crm_campaign_sequence_steps IS 'Individual steps within campaign sequences';