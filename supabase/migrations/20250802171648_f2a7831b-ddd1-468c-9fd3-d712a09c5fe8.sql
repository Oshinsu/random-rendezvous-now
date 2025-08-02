-- Add scheduled fields to groups table
ALTER TABLE public.groups 
ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN created_by_user_id UUID;

-- Add comment for clarity
COMMENT ON COLUMN public.groups.is_scheduled IS 'Whether this group is scheduled for a future time';
COMMENT ON COLUMN public.groups.scheduled_for IS 'When the group meetup is scheduled for';
COMMENT ON COLUMN public.groups.reminder_sent IS 'Whether reminder notifications have been sent';
COMMENT ON COLUMN public.groups.created_by_user_id IS 'User who created/scheduled this group';

-- Create index for scheduled groups queries
CREATE INDEX idx_groups_scheduled_for ON public.groups(scheduled_for) WHERE is_scheduled = true;
CREATE INDEX idx_groups_creator ON public.groups(created_by_user_id) WHERE created_by_user_id IS NOT NULL;

-- Update existing groups to have is_scheduled = false (already default)
-- This ensures data consistency for existing records