-- Corriger les fonctions qui n'ont pas de search_path défini

-- Corriger la fonction handle_group_participant_changes
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

-- Corriger la fonction auto_cleanup_on_group_operations
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