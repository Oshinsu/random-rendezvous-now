-- Nettoyage DB pour ne garder que IntelligentCleanupService
-- Supprimer les triggers automatiques qui appellent dissolve_old_groups

-- 1. Supprimer les triggers automatiques de nettoyage
DROP TRIGGER IF EXISTS auto_cleanup_on_group_operations ON public.groups;
DROP TRIGGER IF EXISTS auto_cleanup_on_participant_operations ON public.group_participants;

-- 2. Modifier la fonction handle_group_participant_changes pour ne plus appeler de nettoyage automatique
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
        
        -- Check for existing trigger messages
        SELECT COUNT(*) INTO existing_trigger_count
        FROM public.group_messages 
        WHERE group_id = target_group_id 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND is_system = true
        AND created_at > NOW() - INTERVAL '2 minutes';
        
        -- Only create trigger if none exists recently
        IF existing_trigger_count = 0 THEN
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
    
    -- Return appropriate record (NO AUTOMATIC CLEANUP CALLED)
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- 3. Créer un commentaire pour indiquer que le nettoyage est géré par IntelligentCleanupService
COMMENT ON FUNCTION public.dissolve_old_groups() IS 'DEPRECATED: Nettoyage géré par IntelligentCleanupService côté application. Cette fonction est conservée mais ne doit plus être appelée automatiquement.';

-- 4. Optimiser les seuils dans les fonctions existantes pour être plus patients
-- Mettre à jour transition_groups_to_completed pour être moins agressif
CREATE OR REPLACE FUNCTION public.transition_groups_to_completed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    transitioned_count integer := 0;
BEGIN
    -- Transition confirmed groups to completed if meeting time has passed (plus patient: 45 minutes)
    UPDATE public.groups 
    SET status = 'completed'
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '45 minutes'
    AND bar_name IS NOT NULL;
    
    GET DIAGNOSTICS transitioned_count = ROW_COUNT;
    RAISE NOTICE 'Transitioned % groups from confirmed to completed (45min wait)', transitioned_count;
END;
$function$;