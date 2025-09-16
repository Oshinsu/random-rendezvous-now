-- Correction DÉFINITIVE de la fonction de nettoyage
-- Rétention CONSERVATRICE pour la phase d'adoption + protection des groupes planifiés

CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    cleanup_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting ULTRA-CONSERVATIVE cleanup at % (7-day retention for adoption phase)', NOW();
    
    -- 1. Transition confirmed groups to completed (keep existing)
    BEGIN
        PERFORM public.transition_groups_to_completed();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error transitioning groups to completed: %', SQLERRM;
    END;
    
    -- 2. Supprimer SEULEMENT les participants inactifs depuis 7 JOURS (phase d'adoption)
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - INTERVAL '7 days';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % participants inactive for 7+ days', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 3. Supprimer SEULEMENT les groupes vides depuis 7 JOURS (phase d'adoption)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - INTERVAL '7 days'
        AND (is_scheduled = false OR is_scheduled IS NULL);
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % empty non-scheduled groups older than 7 days', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 4. Supprimer SEULEMENT les groupes complétés depuis 3 JOURS
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '3 days';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % completed groups older than 3 days', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    -- 5. CORRECTION MAJEURE: Groupes planifiés supprimés 1 JOUR après leur date prévue
    BEGIN
        DELETE FROM public.groups 
        WHERE is_scheduled = true
        AND (
            -- Groupes planifiés expirés depuis 1 jour (NON complétés)
            (scheduled_for < NOW() - INTERVAL '1 day' AND status != 'completed')
            OR
            -- Groupes annulés depuis 1 jour
            (status = 'cancelled' AND updated_at < NOW() - INTERVAL '1 day')
        );
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % expired scheduled groups (1 day after scheduled_for)', cleanup_count;
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
    
    RAISE NOTICE 'ULTRA-CONSERVATIVE cleanup completed at % (7-day retention, scheduled groups protected)', NOW();
END;
$function$;