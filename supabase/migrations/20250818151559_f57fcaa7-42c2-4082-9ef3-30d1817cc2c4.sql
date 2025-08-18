-- Create system_settings table for persistent configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('max_group_size', '5', 'Maximum number of participants per group'),
('default_search_radius', '10000', 'Default search radius in meters'),
('maintenance_mode', 'false', 'Enable maintenance mode to disable user access'),
('email_notifications', 'true', 'Enable email notifications'),
('auto_cleanup_enabled', 'true', 'Enable automatic cleanup of old data'),
('cleanup_interval_hours', '24', 'Interval between automatic cleanups in hours')
ON CONFLICT (setting_key) DO NOTHING;

-- Create api_requests_log table for tracking Google Places API usage
CREATE TABLE IF NOT EXISTS public.api_requests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL DEFAULT 'google_places',
  endpoint TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'search', 'details', 'photo', etc.
  status_code INTEGER,
  response_time_ms INTEGER,
  cost_usd DECIMAL(10,6) DEFAULT 0.017, -- Default Google Places cost per request
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  group_id UUID
);

-- Enable RLS on new tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_requests_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_settings (admin only)
CREATE POLICY "Only admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Create RLS policies for api_requests_log (admin only)
CREATE POLICY "Only admins can view API logs" 
ON public.api_requests_log 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "System can insert API logs" 
ON public.api_requests_log 
FOR INSERT 
WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- Create function to get system settings
CREATE OR REPLACE FUNCTION public.get_system_setting(setting_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT setting_value FROM public.system_settings WHERE setting_key = setting_name);
END;
$$;

-- Create function to update system settings
CREATE OR REPLACE FUNCTION public.update_system_setting(setting_name TEXT, new_value JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can update system settings';
  END IF;
  
  INSERT INTO public.system_settings (setting_key, setting_value, updated_at)
  VALUES (setting_name, new_value, NOW())
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = NOW();
END;
$$;