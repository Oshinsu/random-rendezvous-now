-- Update dissolve_old_groups function to protect scheduled groups
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
    
    -- NOUVEAU: Identifier les groupes protégés (récents - moins de 30 minutes OU groupes planifiés actifs)
    SELECT ARRAY(
        SELECT id FROM public.groups 
        WHERE (
            -- Groupes récents (moins de 30 minutes)
            (created_at > NOW() - INTERVAL '30 minutes' AND status IN ('waiting', 'confirmed'))
            OR 
            -- Groupes planifiés qui ne sont pas encore arrivés à échéance
            (is_scheduled = true AND scheduled_for > NOW() AND status NOT IN ('cancelled'))
        )
    ) INTO protected_group_ids;
    
    RAISE NOTICE 'Protected % groups from cleanup (including scheduled groups)', array_length(protected_group_ids, 1);
    
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
        RAISE NOTICE 'Removed % inactive participants (protecting recent and scheduled groups)', cleanup_count;
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
        RAISE NOTICE 'Removed % empty waiting groups (protecting recent and scheduled groups)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 3. NOUVEAU: Nettoyer les groupes planifiés expirés ou annulés
    BEGIN
        DELETE FROM public.groups 
        WHERE is_scheduled = true
        AND (
            -- Groupes planifiés expirés (plus de 6 heures après l'heure prévue)
            (scheduled_for < NOW() - INTERVAL '6 hours' AND status != 'completed')
            OR
            -- Groupes planifiés annulés depuis plus de 24 heures
            (status = 'cancelled' AND updated_at < NOW() - INTERVAL '24 hours')
        );
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % expired or cancelled scheduled groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning scheduled groups: %', SQLERRM;
    END;
    
    -- 4. Corriger les compteurs de participants (TOUS les groupes)
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
    
    -- 5. Nettoyer les messages de déclenchement anciens (5 minutes)
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
    
    -- 6. Now safe to delete very old completed groups (6+ hours after completion)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '6 hours'
        AND (is_scheduled = false OR is_scheduled IS NULL); -- Protection supplémentaire pour les groupes planifiés
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % old completed groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Safe cleanup completed at %', NOW();
END;
$function$;

-- Create a function to activate ready scheduled groups
CREATE OR REPLACE FUNCTION public.activate_ready_scheduled_groups()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    activated_count integer := 0;
    group_record RECORD;
BEGIN
    RAISE NOTICE 'Starting scheduled group activation at %', NOW();
    
    -- Find scheduled groups whose time has come
    FOR group_record IN 
        SELECT id, scheduled_for 
        FROM public.groups 
        WHERE is_scheduled = true 
        AND scheduled_for <= NOW() 
        AND status = 'waiting'
    LOOP
        -- Activate the group
        UPDATE public.groups 
        SET 
            is_scheduled = false,
            scheduled_for = NULL
        WHERE id = group_record.id;
        
        -- Send activation message
        INSERT INTO public.group_messages (
            group_id,
            user_id,
            message,
            is_system
        ) VALUES (
            group_record.id,
            '00000000-0000-0000-0000-000000000000',
            'Votre groupe planifié est maintenant actif ! Attendez que 5 personnes rejoignent pour qu''un bar soit automatiquement assigné.',
            true
        );
        
        activated_count := activated_count + 1;
        RAISE NOTICE 'Activated scheduled group %', group_record.id;
    END LOOP;
    
    RAISE NOTICE 'Activated % scheduled groups', activated_count;
    RETURN activated_count;
END;
$function$;