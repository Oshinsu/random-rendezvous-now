-- Add channels column to crm_campaigns for multi-channel support
ALTER TABLE public.crm_campaigns 
ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT ARRAY['email']::TEXT[];

-- Create index for scheduled campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled 
ON public.crm_campaigns(send_at) 
WHERE status = 'scheduled';

-- Add comment for documentation
COMMENT ON COLUMN public.crm_campaigns.channels IS 'Array of channels for campaign delivery: email, in_app, push';