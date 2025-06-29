
-- Correction des avertissements "Function Search Path Mutable"
-- Ajout de SET search_path = 'public' à toutes les fonctions concernées

-- 1. Fonction auto_cleanup_on_group_operations
CREATE OR REPLACE FUNCTION public.auto_cleanup_on_group_operations()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Appeler le nettoyage automatique à chaque opération sur les groupes
  PERFORM dissolve_old_groups();
  
  -- Retourner l'enregistrement approprié selon l'opération
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 2. Fonction create_group_with_participant
CREATE OR REPLACE FUNCTION public.create_group_with_participant(p_latitude double precision, p_longitude double precision, p_location_name text, p_user_id uuid)
RETURNS TABLE(id uuid, status text, max_participants integer, current_participants integer, latitude double precision, longitude double precision, location_name text, search_radius integer, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- 3. Fonction dissolve_old_groups
CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
    cleanup_count integer := 0;
BEGIN
    -- Log du début du nettoyage
    RAISE NOTICE 'Starting safe cleanup at %', NOW();
    
    -- 1. Supprimer les participants inactifs (12 heures)
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - INTERVAL '12 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % inactive participants', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 2. Supprimer les groupes en attente vides (10 minutes)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - INTERVAL '10 minutes';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % empty waiting groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 3. Corriger les compteurs de participants
    BEGIN
        UPDATE public.groups 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM public.group_participants 
            WHERE group_id = groups.id 
            AND status = 'confirmed'
        )
        WHERE status IN ('waiting', 'confirmed');
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Updated % group counters', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating counters: %', SQLERRM;
    END;
    
    -- 4. Nettoyer les messages de déclenchement anciens
    BEGIN
        DELETE FROM public.group_messages 
        WHERE is_system = true 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND created_at < NOW() - INTERVAL '1 hour';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % old trigger messages', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning trigger messages: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Safe cleanup completed at %', NOW();
END;
$function$;

-- 4. Fonction handle_group_participant_changes
CREATE OR REPLACE FUNCTION public.handle_group_participant_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
    current_count integer;
    group_info record;
    target_group_id uuid;
BEGIN
    -- Get the group ID from either NEW or OLD record
    target_group_id := COALESCE(NEW.group_id, OLD.group_id);
    
    -- Count current confirmed participants
    SELECT COUNT(*) INTO current_count
    FROM public.group_participants 
    WHERE group_id = target_group_id 
    AND status = 'confirmed';
    
    -- Get current group information
    SELECT * INTO group_info
    FROM public.groups 
    WHERE id = target_group_id;
    
    -- Update the group's participant count
    UPDATE public.groups 
    SET current_participants = current_count
    WHERE id = target_group_id;
    
    -- Handle group status changes and bar assignment
    IF current_count = 5 AND group_info.status = 'waiting' THEN
        -- Group is now full, change status to confirmed
        UPDATE public.groups 
        SET status = 'confirmed'
        WHERE id = target_group_id;
        
        -- Trigger automatic bar assignment via message système
        INSERT INTO public.group_messages (
            group_id,
            user_id,
            message,
            is_system
        ) VALUES (
            target_group_id,
            '00000000-0000-0000-0000-000000000000',
            'AUTO_BAR_ASSIGNMENT_TRIGGER',
            true
        );
        
    ELSIF current_count < 5 AND group_info.status = 'confirmed' AND group_info.bar_name IS NULL THEN
        -- Group is no longer full and has no bar assigned, revert to waiting
        UPDATE public.groups 
        SET status = 'waiting'
        WHERE id = target_group_id;
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- 5. Fonction trigger_auto_bar_assignment
CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    -- Only trigger when status changes from 'waiting' to 'confirmed' and no bar is assigned
    IF OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL THEN
        -- Insert a job record that the edge function can pick up
        INSERT INTO public.group_messages (
            group_id,
            user_id,
            message,
            is_system
        ) VALUES (
            NEW.id,
            '00000000-0000-0000-0000-000000000000',
            'AUTO_BAR_ASSIGNMENT_TRIGGER',
            true
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 6. Fonction validate_coordinates_strict
CREATE OR REPLACE FUNCTION public.validate_coordinates_strict(lat double precision, lng double precision)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Validation stricte avec gestion des cas edge
    IF lat IS NULL OR lng IS NULL THEN
        RETURN false;
    END IF;
    
    -- Vérifications des limites géographiques
    IF lat < -90.0 OR lat > 90.0 THEN
        RETURN false;
    END IF;
    
    IF lng < -180.0 OR lng > 180.0 THEN
        RETURN false;
    END IF;
    
    -- Vérifications des valeurs spéciales (NaN, Infinity)
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

-- 7. Fonction update_bar_rating
CREATE OR REPLACE FUNCTION public.update_bar_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Si c'est un nouveau rating
  IF TG_OP = 'UPDATE' AND OLD.user_rating IS NULL AND NEW.user_rating IS NOT NULL THEN
    -- Insérer ou mettre à jour le rating global du bar
    INSERT INTO public.bar_ratings (
      bar_place_id, bar_name, bar_address, total_ratings, sum_ratings, average_rating
    )
    VALUES (
      (SELECT bar_place_id FROM public.groups WHERE id = NEW.group_id),
      NEW.bar_name,
      NEW.bar_address,
      1,
      NEW.user_rating,
      NEW.user_rating::decimal
    )
    ON CONFLICT (bar_place_id) 
    DO UPDATE SET
      total_ratings = bar_ratings.total_ratings + 1,
      sum_ratings = bar_ratings.sum_ratings + NEW.user_rating,
      average_rating = (bar_ratings.sum_ratings + NEW.user_rating)::decimal / (bar_ratings.total_ratings + 1),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. Fonction validate_and_clean_message
CREATE OR REPLACE FUNCTION public.validate_and_clean_message(input_message text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Nettoyer et valider le message
  input_message := trim(input_message);
  
  -- Vérifications de sécurité
  IF input_message IS NULL OR length(input_message) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  IF length(input_message) > 500 THEN
    RAISE EXCEPTION 'Message too long (max 500 characters)';
  END IF;
  
  -- Échapper les caractères dangereux (basique)
  input_message := replace(input_message, '<script', '&lt;script');
  input_message := replace(input_message, '</script', '&lt;/script');
  input_message := replace(input_message, 'javascript:', 'javascript_');
  input_message := replace(input_message, 'data:', 'data_');
  
  RETURN input_message;
END;
$function$;

-- 9. Fonction validate_coordinates
CREATE OR REPLACE FUNCTION public.validate_coordinates(lat double precision, lng double precision)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (lat IS NOT NULL AND lng IS NOT NULL AND 
          lat >= -90 AND lat <= 90 AND 
          lng >= -180 AND lng <= 180);
END;
$function$;

-- 10. Fonction check_user_participation_limit
CREATE OR REPLACE FUNCTION public.check_user_participation_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    active_groups_count integer;
BEGIN
  SELECT COUNT(*) INTO active_groups_count
  FROM public.group_participants gp
  JOIN public.groups g ON gp.group_id = g.id
  WHERE gp.user_id = user_uuid 
  AND gp.status = 'confirmed'
  AND g.status IN ('waiting', 'confirmed');
  
  RETURN active_groups_count = 0; -- Un seul groupe actif autorisé
END;
$function$;

-- 11. Fonction validate_message_before_insert
CREATE OR REPLACE FUNCTION public.validate_message_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Valider et nettoyer le message
  NEW.message := public.validate_and_clean_message(NEW.message);
  
  -- Mettre à jour le last_seen automatiquement
  IF NOT NEW.is_system THEN
    UPDATE public.group_participants 
    SET last_seen = now()
    WHERE group_id = NEW.group_id 
    AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 12. Fonction validate_participant_before_insert
CREATE OR REPLACE FUNCTION public.validate_participant_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Permettre plusieurs groupes temporairement pour éviter les blocages
  -- On ne vérifie plus la limite de participation pour l'instant
  
  -- Valider les coordonnées si présentes
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    IF NOT public.validate_coordinates(NEW.latitude, NEW.longitude) THEN
      RAISE EXCEPTION 'Invalid coordinates provided';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
