
-- Phase 1: Système d'attribution automatique de bars UNIFIÉ
-- Suppression des conflits et implémentation d'un système cohérent

-- 1. Supprimer l'ancien système de déclenchement conflictuel
DROP TRIGGER IF EXISTS trigger_auto_bar_assignment ON public.groups;
DROP FUNCTION IF EXISTS public.trigger_auto_bar_assignment();

-- 2. Modifier la fonction principale pour gérer l'attribution IMMÉDIATEMENT
CREATE OR REPLACE FUNCTION public.handle_group_participant_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    current_count integer;
    group_info record;
    target_group_id uuid;
    bar_result record;
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
        
        -- Attribution automatique IMMÉDIATE du bar via Edge Function
        BEGIN
            -- Appel sécurisé à l'Edge Function avec gestion d'erreur
            SELECT net.http_post(
                url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/auto-assign-bar',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
                ),
                body := jsonb_build_object(
                    'group_id', target_group_id,
                    'latitude', group_info.latitude,
                    'longitude', group_info.longitude
                )
            ) INTO bar_result;
            
            -- Log the result for debugging
            RAISE NOTICE 'Bar assignment triggered for group % at %', target_group_id, now();
            
        EXCEPTION WHEN OTHERS THEN
            -- En cas d'erreur, envoyer un message système de fallback
            INSERT INTO public.group_messages (
                group_id,
                user_id,
                message,
                is_system
            ) VALUES (
                target_group_id,
                '00000000-0000-0000-0000-000000000000',
                '🍺 Votre groupe est complet ! Attribution du bar en cours...',
                true
            );
            
            RAISE NOTICE 'Bar assignment fallback for group %: %', target_group_id, SQLERRM;
        END;
        
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

-- 3. S'assurer que le trigger principal existe et est configuré correctement
DROP TRIGGER IF EXISTS trigger_group_participant_changes ON public.group_participants;
CREATE TRIGGER trigger_group_participant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_group_participant_changes();

-- 4. Fonction de nettoyage automatique des messages de déclenchement
CREATE OR REPLACE FUNCTION public.cleanup_trigger_messages()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Supprimer les anciens messages de déclenchement (plus de 1 heure)
    DELETE FROM public.group_messages 
    WHERE is_system = true 
    AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
    AND created_at < NOW() - INTERVAL '1 hour';
    
    RAISE NOTICE 'Trigger messages cleanup completed at %', NOW();
END;
$function$;

-- 5. Validation stricte des coordonnées avec gestion d'erreur améliorée
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

-- 6. Mise à jour de la validation des participants avec la nouvelle fonction
CREATE OR REPLACE FUNCTION public.validate_participant_coordinates()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Valider les coordonnées avec la fonction stricte
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        IF NOT public.validate_coordinates_strict(NEW.latitude, NEW.longitude) THEN
            RAISE EXCEPTION 'Invalid coordinates: lat=%, lng=%', NEW.latitude, NEW.longitude;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 7. Appliquer le trigger de validation des coordonnées
DROP TRIGGER IF EXISTS trigger_validate_participant_coordinates ON public.group_participants;
CREATE TRIGGER trigger_validate_participant_coordinates
    BEFORE INSERT OR UPDATE ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_participant_coordinates();

-- 8. Mettre à jour les références dans les groupes aussi
DROP TRIGGER IF EXISTS trigger_validate_group_coordinates ON public.groups;
CREATE TRIGGER trigger_validate_group_coordinates
    BEFORE INSERT OR UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION validate_participant_coordinates();
