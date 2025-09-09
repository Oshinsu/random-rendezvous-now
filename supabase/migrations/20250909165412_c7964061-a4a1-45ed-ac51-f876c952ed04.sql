-- Update default search radius to 25km (25000 meters)
UPDATE public.system_settings 
SET setting_value = '25000'::jsonb, updated_at = NOW()
WHERE setting_key = 'default_search_radius';

-- Insert the setting if it doesn't exist
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('default_search_radius', '25000'::jsonb, 'Default search radius in meters for finding compatible groups')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = '25000'::jsonb,
  updated_at = NOW();