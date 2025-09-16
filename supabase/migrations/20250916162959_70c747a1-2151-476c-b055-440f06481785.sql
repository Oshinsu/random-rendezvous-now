CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    cleanup_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting CONSERVATIVE cleanup at % (24h retention)', NOW();
    
    -- 1. Transition confirmed groups to completed (keep existing)
    BEGIN
        PERFORM public.transition_groups_to_completed();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error transitioning groups to completed: %', SQLERRM;
    END;
    
    -- 2. Supprimer SEULEMENT les participants inactifs depuis 24 HEURES
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - INTERVAL '24 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % participants inactive for 24+ hours', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 3. Supprimer SEULEMENT les groupes vides depuis 24 HEURES
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - INTERVAL '24 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % empty groups older than 24 hours', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 4. Supprimer SEULEMENT les groupes complétés depuis 24 HEURES
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '24 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % completed groups older than 24 hours', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    -- 5. Supprimer les groupes planifiés expirés (72h après expiration)
    BEGIN
        DELETE FROM public.groups 
        WHERE is_scheduled = true
        AND (
            (scheduled_for < NOW() - INTERVAL '72 hours' AND status != 'completed')
            OR
            (status = 'cancelled' AND updated_at < NOW() - INTERVAL '24 hours')
        );
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % expired scheduled groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning scheduled groups: %', SQLERRM;
    END;
    
    -- 6. Corriger les compteurs (garder)
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
    
    -- 7. Nettoyer les anciens messages trigger (garder)
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
    
    RAISE NOTICE 'CONSERVATIVE cleanup completed at % (24h retention policy)', NOW();
END;
$function$