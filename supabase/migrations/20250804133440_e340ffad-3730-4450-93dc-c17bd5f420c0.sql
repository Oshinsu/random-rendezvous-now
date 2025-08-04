-- Add new columns to groups table for scheduled groups with manual bar selection
ALTER TABLE public.groups 
ADD COLUMN city_name TEXT,
ADD COLUMN bar_name_manual TEXT,
ADD COLUMN bar_address_manual TEXT;

-- Update the groups table to support the new scheduled group workflow
-- These columns will be used when users manually select a bar and city
COMMENT ON COLUMN public.groups.city_name IS 'Manually selected city for scheduled groups';
COMMENT ON COLUMN public.groups.bar_name_manual IS 'Manually entered bar name for scheduled groups';
COMMENT ON COLUMN public.groups.bar_address_manual IS 'Manually entered bar address for scheduled groups';