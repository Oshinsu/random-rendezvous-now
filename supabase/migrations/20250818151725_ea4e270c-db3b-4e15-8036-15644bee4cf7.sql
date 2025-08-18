-- Fix security warnings by setting search_path for the functions
CREATE OR REPLACE FUNCTION public.get_system_setting(setting_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT setting_value FROM public.system_settings WHERE setting_key = setting_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_system_setting(setting_name TEXT, new_value JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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