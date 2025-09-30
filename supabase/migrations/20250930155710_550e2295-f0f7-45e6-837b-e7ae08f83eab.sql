-- Fix PPU RPC functions to properly parse JSONB values

CREATE OR REPLACE FUNCTION public.is_ppu_mode_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT (setting_value->>0)::boolean FROM public.system_settings WHERE setting_key = 'ppu_mode_enabled'),
    false
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_ppu_price_cents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT (setting_value->>0)::integer FROM public.system_settings WHERE setting_key = 'ppu_price_cents'),
    99
  );
END;
$function$;