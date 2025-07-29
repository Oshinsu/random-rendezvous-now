-- PHASE 1: CORRECTIONS CRITIQUES DE SÉCURITÉ
-- 1. Correction des fonctions avec search_path sécurisé

-- Mise à jour de toutes les fonctions pour sécuriser le search_path
CREATE OR REPLACE FUNCTION public.set_completed_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Quand le statut passe à 'completed', définir completed_at automatiquement
    IF NEW.status = 'completed' AND (OLD.completed_at IS NULL OR NEW.completed_at IS NULL) THEN
        NEW.completed_at = NOW();
        RAISE NOTICE 'Setting completed_at to % for group %', NEW.completed_at, NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transition_groups_to_completed()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    transitioned_count integer := 0;
BEGIN
    -- Transition confirmed groups to completed if meeting time has passed
    UPDATE public.groups 
    SET status = 'completed'
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '30 minutes'
    AND bar_name IS NOT NULL;
    
    GET DIAGNOSTICS transitioned_count = ROW_COUNT;
    RAISE NOTICE 'Transitioned % groups from confirmed to completed', transitioned_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.repair_missing_outings_history()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    repair_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting repair of missing outings history at %', NOW();
    
    -- Insert missing history entries for completed groups that have participants but no history
    INSERT INTO public.user_outings_history (
        user_id,
        group_id,
        bar_name,
        bar_address,
        meeting_time,
        participants_count,
        bar_latitude,
        bar_longitude
    )
    SELECT DISTINCT
        gp.user_id,
        g.id,
        g.bar_name,
        g.bar_address,
        g.meeting_time,
        g.current_participants,
        g.bar_latitude,
        g.bar_longitude
    FROM public.groups g
    JOIN public.group_participants gp ON gp.group_id = g.id
    WHERE g.status = 'completed'
        AND g.bar_name IS NOT NULL
        AND gp.status = 'confirmed'
        AND NOT EXISTS (
            SELECT 1 FROM public.user_outings_history uoh
            WHERE uoh.group_id = g.id AND uoh.user_id = gp.user_id
        );
    
    GET DIAGNOSTICS repair_count = ROW_COUNT;
    RAISE NOTICE 'Repaired % missing history entries', repair_count;
    
    RETURN repair_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_to_outings_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count integer := 0;
BEGIN
    RAISE NOTICE 'add_to_outings_history trigger fired: OLD.status=%, NEW.status=%, bar_name=%, completed_at=%', 
        COALESCE(OLD.status, 'NULL'), NEW.status, NEW.bar_name, NEW.completed_at;
    
    -- Vérifier si le groupe passe au statut 'completed' ET a un bar assigné
    IF (OLD.status IS NULL OR OLD.status != 'completed') 
       AND NEW.status = 'completed' 
       AND NEW.bar_name IS NOT NULL 
       AND NEW.completed_at IS NOT NULL THEN
        
        -- Ajouter chaque participant confirmé à l'historique
        INSERT INTO public.user_outings_history (
            user_id,
            group_id,
            bar_name,
            bar_address,
            meeting_time,
            participants_count,
            bar_latitude,
            bar_longitude,
            completed_at
        )
        SELECT DISTINCT
            gp.user_id,
            NEW.id,
            NEW.bar_name,
            COALESCE(NEW.bar_address, 'Adresse non disponible'),
            NEW.meeting_time,
            NEW.current_participants,
            NEW.bar_latitude,
            NEW.bar_longitude,
            NEW.completed_at
        FROM public.group_participants gp
        WHERE gp.group_id = NEW.id 
            AND gp.status = 'confirmed'
            -- Éviter les doublons
            AND NOT EXISTS (
                SELECT 1 FROM public.user_outings_history uoh
                WHERE uoh.group_id = NEW.id AND uoh.user_id = gp.user_id
            );
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE 'Inserted % entries into user_outings_history for group %', inserted_count, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_coordinates_strict(lat double precision, lng double precision)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    
    -- Vérification de précision excessive (plus de 6 décimales)
    IF (lat * 1000000)::integer != (lat * 1000000) THEN
        RETURN false;
    END IF;
    
    IF (lng * 1000000)::integer != (lng * 1000000) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$function$;

-- CORRECTION CRITIQUE: Fonction dissolve_old_groups avec requêtes UUID corrigées
CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    cleanup_count integer := 0;
    protected_group_ids uuid[];
BEGIN
    -- Log du début du nettoyage
    RAISE NOTICE 'Starting safe cleanup at %', NOW();
    
    -- NOUVEAU: Identifier les groupes protégés (récents - moins de 30 minutes)
    SELECT ARRAY(
        SELECT id FROM public.groups 
        WHERE created_at > NOW() - INTERVAL '30 minutes'
        AND status IN ('waiting', 'confirmed')
    ) INTO protected_group_ids;
    
    RAISE NOTICE 'Protected % recent groups from cleanup', array_length(protected_group_ids, 1);
    
    -- 0. First, transition confirmed groups to completed status
    BEGIN
        PERFORM public.transition_groups_to_completed();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error transitioning groups to completed: %', SQLERRM;
    END;
    
    -- 1. Supprimer les participants inactifs (24 heures) MAIS PAS des groupes protégés
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - INTERVAL '24 hours'
        AND (protected_group_ids IS NULL OR NOT (group_id = ANY(protected_group_ids)));
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % inactive participants (protecting recent groups)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 2. Supprimer les groupes en attente vides (30 minutes) MAIS PAS les protégés
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - INTERVAL '30 minutes'
        AND (protected_group_ids IS NULL OR NOT (id = ANY(protected_group_ids)));
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % empty waiting groups (protecting recent groups)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 3. Corriger les compteurs de participants (TOUS les groupes)
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
    
    -- 4. Nettoyer les messages de déclenchement anciens (5 minutes)
    BEGIN
        DELETE FROM public.group_messages 
        WHERE is_system = true 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND created_at < NOW() - INTERVAL '5 minutes';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % old trigger messages', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning trigger messages: %', SQLERRM;
    END;
    
    -- 5. Now safe to delete very old completed groups (6+ hours after completion)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '6 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % old completed groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Safe cleanup completed at %', NOW();
END;
$function$;

-- Mise à jour des autres fonctions critiques avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_uuid uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT group_id 
    FROM public.group_participants 
    WHERE user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_message_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.check_user_participation_limit(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.validate_coordinates(lat double precision, lng double precision)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (lat IS NOT NULL AND lng IS NOT NULL AND 
          lat >= -90 AND lat <= 90 AND 
          lng >= -180 AND lng <= 180);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_in_group(group_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_uuid 
    AND user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_uuid 
    AND user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_and_clean_message(input_message text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_participant_last_seen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Mettre à jour last_seen pour l'utilisateur qui envoie un message
  UPDATE public.group_participants 
  SET last_seen = now()
  WHERE group_id = NEW.group_id 
  AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- CORRECTION CRITIQUE: Trigger d'attribution automatique avec réduction des messages système
CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    existing_trigger_count integer;
BEGIN
    -- Only trigger when status changes from 'waiting' to 'confirmed' and no bar is assigned
    IF OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL THEN
        
        -- NOUVEAU: Vérifier s'il n'y a pas déjà un trigger en cours pour ce groupe
        SELECT COUNT(*) INTO existing_trigger_count
        FROM public.group_messages 
        WHERE group_id = NEW.id 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND is_system = true
        AND created_at > NOW() - INTERVAL '2 minutes';
        
        -- Ne créer le trigger que s'il n'y en a pas déjà un récent
        IF existing_trigger_count = 0 THEN
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
            
            RAISE NOTICE 'Bar assignment trigger created for group %', NEW.id;
        ELSE
            RAISE NOTICE 'Bar assignment trigger already exists for group %, skipping', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, -- ID du nouvel utilisateur depuis auth.users
    NEW.raw_user_meta_data ->> 'first_name', -- Sera extrait des métadonnées fournies lors de l'inscription
    NEW.raw_user_meta_data ->> 'last_name',  -- Sera extrait des métadonnées fournies lors de l'inscription
    NEW.email -- Email du nouvel utilisateur depuis auth.users
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
 RETURNS double precision
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
    r DOUBLE PRECISION := 6371000; -- Rayon de la Terre en mètres
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * asin(sqrt(a));
    
    RETURN r * c;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_cleanup_on_group_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.can_view_group(group_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Permettre de voir les groupes en attente (pour pouvoir les rejoindre)
  -- ou les groupes où l'utilisateur est membre
  RETURN EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_uuid 
    AND (status = 'waiting' OR id IN (
      SELECT group_id FROM public.group_participants 
      WHERE user_id = auth.uid() AND status = 'confirmed'
    ))
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_group_with_participant(p_latitude double precision, p_longitude double precision, p_location_name text, p_user_id uuid)
 RETURNS TABLE(id uuid, status text, max_participants integer, current_participants integer, latitude double precision, longitude double precision, location_name text, search_radius integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- CORRECTION CRITIQUE: Trigger de gestion des participants avec réduction des messages système
CREATE OR REPLACE FUNCTION public.handle_group_participant_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_count integer;
    group_info record;
    target_group_id uuid;
    existing_trigger_count integer;
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
        
        -- NOUVEAU: Vérifier s'il n'y a pas déjà un trigger récent
        SELECT COUNT(*) INTO existing_trigger_count
        FROM public.group_messages 
        WHERE group_id = target_group_id 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND is_system = true
        AND created_at > NOW() - INTERVAL '2 minutes';
        
        -- Ne créer le trigger que s'il n'y en a pas déjà un récent
        IF existing_trigger_count = 0 THEN
            -- Déclencher l'attribution automatique via message système
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
            
            RAISE NOTICE 'Bar assignment trigger message inserted for group % at %', target_group_id, now();
        ELSE
            RAISE NOTICE 'Bar assignment trigger already exists for group %, skipping duplicate', target_group_id;
        END IF;
        
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

CREATE OR REPLACE FUNCTION public.update_bar_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.validate_bar_name(input_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Vérifier que le nom n'est pas un Place ID
  IF input_name IS NULL THEN
    RETURN false;
  END IF;
  
  IF input_name LIKE 'places/%' OR input_name LIKE 'ChIJ%' THEN
    RETURN false;
  END IF;
  
  IF length(trim(input_name)) < 2 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_participant_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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