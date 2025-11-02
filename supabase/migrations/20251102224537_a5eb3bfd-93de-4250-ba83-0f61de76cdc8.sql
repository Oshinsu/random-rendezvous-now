-- PHASE 1: Corriger create_group_with_participant pour initialiser current_participants à 0
-- Le trigger handle_group_participant_changes_ppu va ensuite l'incrémenter à 1

CREATE OR REPLACE FUNCTION public.create_group_with_participant(
  p_latitude double precision, 
  p_longitude double precision, 
  p_location_name text, 
  p_user_id uuid
)
RETURNS TABLE(
  id uuid, 
  status text, 
  max_participants integer, 
  current_participants integer, 
  latitude double precision, 
  longitude double precision, 
  location_name text, 
  search_radius integer, 
  created_at timestamp with time zone
)
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
    -- ✅ FIX CRITIQUE: Initialiser current_participants à 0 au lieu de 1
    -- Le trigger handle_group_participant_changes_ppu va l'incrémenter correctement
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
      0, -- ✅ CHANGEMENT: 0 au lieu de 1, le trigger va incrémenter
      p_latitude,
      p_longitude,
      p_location_name,
      10000,
      p_user_id
    ) RETURNING public.groups.id INTO new_group_id;

    RAISE NOTICE '✅ Group created with id=%, initial current_participants=0', new_group_id;

    -- 2. Immediately add the creator as participant with sanitized coordinates
    -- Le trigger handle_group_participant_changes_ppu va incrémenter current_participants de 0 à 1
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

    RAISE NOTICE '✅ Creator added as participant, trigger will increment current_participants to 1';

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

-- PHASE 2: Réparer les données corrompues dans les groupes existants
-- Recalculer current_participants en fonction du COUNT réel de group_participants

DO $$
DECLARE
  repaired_count integer := 0;
  total_groups integer := 0;
BEGIN
  -- Compter les groupes concernés
  SELECT COUNT(*) INTO total_groups
  FROM groups g
  WHERE g.current_participants != (
    SELECT COUNT(*) 
    FROM group_participants gp 
    WHERE gp.group_id = g.id AND gp.status = 'confirmed'
  );

  RAISE NOTICE 'Found % groups with incorrect current_participants', total_groups;

  -- Réparer tous les groupes avec compteur incorrect
  UPDATE groups g
  SET current_participants = (
    SELECT COUNT(*) 
    FROM group_participants gp 
    WHERE gp.group_id = g.id AND gp.status = 'confirmed'
  )
  WHERE g.current_participants != (
    SELECT COUNT(*) 
    FROM group_participants gp 
    WHERE gp.group_id = g.id AND gp.status = 'confirmed'
  );

  GET DIAGNOSTICS repaired_count = ROW_COUNT;
  RAISE NOTICE '✅ Repaired % groups with incorrect participant counts', repaired_count;
END $$;