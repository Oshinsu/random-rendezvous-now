
-- Update the atomic group creation function to handle all edge cases
CREATE OR REPLACE FUNCTION create_group_with_participant(
  p_latitude double precision,
  p_longitude double precision,
  p_location_name text,
  p_user_id uuid
) RETURNS TABLE(
  id uuid,
  status text,
  max_participants integer,
  current_participants integer,
  latitude double precision,
  longitude double precision,
  location_name text,
  search_radius integer,
  created_at timestamp with time zone
) AS $$
DECLARE
  new_group_id uuid;
  validation_result boolean;
BEGIN
  -- Validate coordinates first
  SELECT public.validate_coordinates(p_latitude, p_longitude) INTO validation_result;
  
  IF NOT validation_result THEN
    RAISE EXCEPTION 'Invalid coordinates: lat=%, lng=%', p_latitude, p_longitude;
  END IF;

  -- Check if user can create a group (limit to one active group per user)
  IF NOT public.check_user_participation_limit(p_user_id) THEN
    RAISE EXCEPTION 'User is already in an active group';
  END IF;

  -- Start atomic transaction
  BEGIN
    -- 1. Create the group
    INSERT INTO public.groups (
      status,
      max_participants,
      current_participants,
      latitude,
      longitude,
      location_name,
      search_radius
    ) VALUES (
      'waiting',
      5,
      1, -- Already 1 participant (the creator)
      p_latitude,
      p_longitude,
      p_location_name,
      10000
    ) RETURNING public.groups.id INTO new_group_id;

    -- 2. Immediately add the creator as participant
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

    -- 3. Return the created group data
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the cleanup function to be less aggressive during group creation
CREATE OR REPLACE FUNCTION dissolve_old_groups()
RETURNS void AS $$
BEGIN
  -- 1. Remove inactive participants (12 hours instead of 6 hours for safety)
  DELETE FROM public.group_participants 
  WHERE last_seen < NOW() - INTERVAL '12 hours';
  
  -- 2. Remove waiting groups that are empty AND older than 10 minutes (increased safety margin)
  DELETE FROM public.groups 
  WHERE status = 'waiting'
  AND current_participants = 0
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND id NOT IN (
    SELECT DISTINCT group_id 
    FROM public.group_participants 
    WHERE status = 'confirmed'
  );
  
  -- 3. Correct group counters
  UPDATE public.groups 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM public.group_participants 
    WHERE group_id = groups.id 
    AND status = 'confirmed'
  )
  WHERE status IN ('waiting', 'confirmed');
  
  -- 4. Revert confirmed groups with less than 5 participants to waiting
  UPDATE public.groups 
  SET status = 'waiting',
      bar_name = NULL,
      bar_address = NULL,
      meeting_time = NULL,
      bar_latitude = NULL,
      bar_longitude = NULL,
      bar_place_id = NULL
  WHERE status = 'confirmed'
  AND current_participants < 5;
  
  -- 5. Remove very old waiting groups (24 hours instead of 48 hours)
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'waiting'
    AND current_participants = 0
    AND created_at < NOW() - INTERVAL '24 hours'
  );
  
  DELETE FROM public.groups 
  WHERE status = 'waiting'
  AND current_participants = 0
  AND created_at < NOW() - INTERVAL '24 hours';
  
  -- 6. Clean up messages from non-existent groups
  DELETE FROM public.group_messages 
  WHERE group_id NOT IN (SELECT id FROM public.groups);
  
  -- 7. Remove completed groups (3 hours after meeting time)
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  DELETE FROM public.groups 
  WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours';
  
  -- Log for debugging
  RAISE NOTICE 'Safe cleanup completed at % - Minimum delays respected', NOW();
END;
$$ LANGUAGE plpgsql;
