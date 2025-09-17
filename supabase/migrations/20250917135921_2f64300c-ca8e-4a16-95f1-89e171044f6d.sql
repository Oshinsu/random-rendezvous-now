-- Create PostgreSQL coordinate sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_coordinates_pg(lat double precision, lng double precision)
RETURNS TABLE(sanitized_lat double precision, sanitized_lng double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Round to maximum 6 decimal places to match JavaScript sanitization
    RETURN QUERY SELECT 
        ROUND(lat::numeric, 6)::double precision as sanitized_lat,
        ROUND(lng::numeric, 6)::double precision as sanitized_lng;
END;
$function$;

-- Update validate_coordinates_strict to auto-sanitize before validation
CREATE OR REPLACE FUNCTION public.validate_coordinates_strict(lat double precision, lng double precision)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    sanitized_result RECORD;
BEGIN
    -- Auto-sanitize coordinates first
    SELECT * INTO sanitized_result FROM public.sanitize_coordinates_pg(lat, lng);
    
    -- Use sanitized values for validation
    lat := sanitized_result.sanitized_lat;
    lng := sanitized_result.sanitized_lng;
    
    -- Basic null checks
    IF lat IS NULL OR lng IS NULL THEN
        RETURN false;
    END IF;
    
    -- Geographic bounds validation
    IF lat < -90.0 OR lat > 90.0 THEN
        RETURN false;
    END IF;
    
    IF lng < -180.0 OR lng > 180.0 THEN
        RETURN false;
    END IF;
    
    -- Check for special values (NaN, Infinity)
    IF lat = 'NaN'::double precision OR lng = 'NaN'::double precision THEN
        RETURN false;
    END IF;
    
    IF lat = 'Infinity'::double precision OR lng = 'Infinity'::double precision THEN
        RETURN false;
    END IF;
    
    IF lat = '-Infinity'::double precision OR lng = '-Infinity'::double precision THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$function$;

-- Update create_group_with_participant to sanitize coordinates before storing
CREATE OR REPLACE FUNCTION public.create_group_with_participant(p_latitude double precision, p_longitude double precision, p_location_name text, p_user_id uuid)
RETURNS TABLE(id uuid, status text, max_participants integer, current_participants integer, latitude double precision, longitude double precision, location_name text, search_radius integer, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_group_id uuid;
  validation_result boolean;
  sanitized_result RECORD;
BEGIN
  -- First sanitize the coordinates
  SELECT * INTO sanitized_result FROM public.sanitize_coordinates_pg(p_latitude, p_longitude);
  p_latitude := sanitized_result.sanitized_lat;
  p_longitude := sanitized_result.sanitized_lng;
  
  -- Validate sanitized coordinates
  SELECT public.validate_coordinates_strict(p_latitude, p_longitude) INTO validation_result;
  
  IF NOT validation_result THEN
    RAISE EXCEPTION 'Invalid coordinates: lat=%, lng=%', p_latitude, p_longitude;
  END IF;

  -- Check if user can create a group (limit to one active group per user)
  IF NOT public.check_user_participation_limit(p_user_id) THEN
    RAISE EXCEPTION 'User is already in an active group';
  END IF;

  -- Start atomic transaction
  BEGIN
    -- 1. Create the group with sanitized coordinates
    INSERT INTO public.groups (
      status,
      max_participants,
      current_participants,
      latitude,
      longitude,
      location_name,
      search_radius,
      created_by_user_id
    ) VALUES (
      'waiting',
      5,
      1, -- Already 1 participant (the creator)
      p_latitude,
      p_longitude,
      p_location_name,
      10000,
      p_user_id
    ) RETURNING public.groups.id INTO new_group_id;

    -- 2. Immediately add the creator as participant with sanitized coordinates
    INSERT INTO public.group_participants (
      group_id,
      user_id,
      status,
      last_seen,
      latitude,
      longitude,
      location_name
    ) VALUES (
      new_group_id,
      p_user_id,
      'confirmed',
      NOW(),
      p_latitude,
      p_longitude,
      p_location_name
    );

    -- 3. Return the created group data with sanitized coordinates
    RETURN QUERY
    SELECT 
      g.id,
      g.status,
      g.max_participants,
      g.current_participants,
      g.latitude,
      g.longitude,
      g.location_name,
      g.search_radius,
      g.created_at
    FROM public.groups g
    WHERE g.id = new_group_id;

  EXCEPTION WHEN OTHERS THEN
    -- In case of any error, the transaction will be automatically rolled back
    RAISE EXCEPTION 'Error during atomic group creation: %', SQLERRM;
  END;
END;
$function$;