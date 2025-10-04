-- Fix final avec opérateurs JSONB appropriés

CREATE OR REPLACE FUNCTION public.is_ppu_mode_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  raw_value text;
BEGIN
  -- Extraire le premier élément de l'array [true] comme texte
  SELECT setting_value->>0 INTO raw_value
  FROM public.system_settings 
  WHERE setting_key = 'ppu_mode_enabled';
  
  RETURN COALESCE(raw_value = 'true', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_ppu_price_cents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  raw_value text;
BEGIN
  -- Utiliser l'opérateur ->> pour extraire le nombre JSONB comme texte
  SELECT setting_value->>'' INTO raw_value
  FROM public.system_settings 
  WHERE setting_key = 'ppu_price_cents';
  
  -- Convertir le texte en integer
  RETURN COALESCE(raw_value::integer, 99);
END;
$function$;