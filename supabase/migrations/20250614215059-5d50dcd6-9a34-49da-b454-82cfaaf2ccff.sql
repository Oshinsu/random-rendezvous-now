
-- Add missing bar coordinates columns to groups table
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS bar_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS bar_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS bar_place_id TEXT;
