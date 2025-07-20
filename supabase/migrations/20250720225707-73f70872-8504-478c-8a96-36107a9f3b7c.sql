
-- Correction de la fonction handle_group_participant_changes
-- Suppression de l'appel net.http_post et utilisation du système de messages

CREATE OR REPLACE FUNCTION public.handle_group_participant_changes()
RETURNS trigger
LANGUAGE plpgsql
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
        
        -- Déclencher l'attribution automatique via message système
        -- CORRECTION: Plus d'appel net.http_post, utilisation du système de messages
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
        
        -- Log pour debug
        RAISE NOTICE 'Bar assignment trigger message inserted for group % at %', target_group_id, now();
        
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

-- Amélioration de la validation stricte des coordonnées
CREATE OR REPLACE FUNCTION public.validate_coordinates_strict(lat double precision, lng double precision)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
