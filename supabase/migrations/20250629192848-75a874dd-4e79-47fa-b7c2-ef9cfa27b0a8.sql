
-- Correction 1: Supprimer le trigger problématique avec net.http_post
DROP TRIGGER IF EXISTS trigger_group_participant_changes ON public.group_participants;
DROP FUNCTION IF EXISTS public.handle_group_participant_changes();

-- Correction 2: Créer une fonction simplifiée sans net.http_post
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

-- Recréer le trigger
CREATE TRIGGER trigger_group_participant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_group_participant_changes();

-- Correction 3: Améliorer les fonctions de validation avec gestion d'erreur
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
    
    RETURN true;
END;
$function$;

-- Correction 4: Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_group_participants_group_status ON public.group_participants(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_participants_last_seen ON public.group_participants(last_seen);
CREATE INDEX IF NOT EXISTS idx_groups_status_participants ON public.groups(status, current_participants);
CREATE INDEX IF NOT EXISTS idx_group_messages_system_trigger ON public.group_messages(group_id, is_system, message) WHERE is_system = true;

-- Correction 5: Améliorer la fonction de nettoyage avec gestion d'erreur renforcée
CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
RETURNS void
LANGUAGE plpgsql
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
