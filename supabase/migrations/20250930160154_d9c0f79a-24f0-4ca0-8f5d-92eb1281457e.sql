-- Create combined PPU config function for better performance
CREATE OR REPLACE FUNCTION public.get_ppu_config()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  enabled_value boolean;
  price_value integer;
BEGIN
  -- Get both values in a single query
  SELECT 
    COALESCE((SELECT (setting_value->>0)::boolean FROM public.system_settings WHERE setting_key = 'ppu_mode_enabled'), false),
    COALESCE((SELECT (setting_value->>0)::integer FROM public.system_settings WHERE setting_key = 'ppu_price_cents'), 99)
  INTO enabled_value, price_value;
  
  RETURN json_build_object(
    'enabled', enabled_value,
    'price_cents', price_value
  );
END;
$function$;