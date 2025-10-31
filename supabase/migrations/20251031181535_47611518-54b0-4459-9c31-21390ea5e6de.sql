-- Drop the old check constraint
ALTER TABLE campaign_email_queue 
DROP CONSTRAINT IF EXISTS campaign_email_queue_status_check;

-- Add new check constraint with 'paused' included
ALTER TABLE campaign_email_queue 
ADD CONSTRAINT campaign_email_queue_status_check 
CHECK (status IN ('pending', 'sending', 'completed', 'paused', 'failed'));