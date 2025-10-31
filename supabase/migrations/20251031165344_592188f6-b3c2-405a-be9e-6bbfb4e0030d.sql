-- Create campaign email queue table
CREATE TABLE IF NOT EXISTS public.campaign_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  users JSONB NOT NULL,
  campaign_data JSONB NOT NULL,
  processed INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- Create index for faster lookups
CREATE INDEX idx_campaign_queue_status ON public.campaign_email_queue(status);
CREATE INDEX idx_campaign_queue_campaign_id ON public.campaign_email_queue(campaign_id);
CREATE INDEX idx_campaign_queue_expires_at ON public.campaign_email_queue(expires_at);

-- Enable RLS
ALTER TABLE public.campaign_email_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access using is_admin_user RPC
CREATE POLICY "Admin can manage campaign queues"
ON public.campaign_email_queue
FOR ALL
TO authenticated
USING (is_admin_user());