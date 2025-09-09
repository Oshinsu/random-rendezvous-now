-- 🧹 CORRECTION URGENTE DES TÂCHES CRON ET OPTIMISATION DES SEUILS

-- 1. Supprimer la tâche cron orpheline qui cause les erreurs 404
SELECT cron.unschedule('activate-scheduled-groups-every-2-min');

-- 2. Modifier la fréquence de cleanup-groups de 10min à 30min pour réduire la charge
SELECT cron.unschedule('cleanup-groups-every-10-min');
SELECT cron.schedule(
    'cleanup-groups-every-30-min',
    '*/30 * * * *', -- Toutes les 30 minutes au lieu de 10
    $$
    SELECT
      net.http_post(
        url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/cleanup-groups',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
        body := jsonb_build_object('invoked_at', now())
      ) as request_id;
    $$
);

-- 3. Optimiser la fonction dissolve_old_groups pour des seuils plus réactifs mais sécurisés
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
    RAISE NOTICE 'Starting OPTIMIZED cleanup at %', NOW();
    
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
    
    -- 1. Supprimer les participants inactifs (6 heures au lieu de 24h) MAIS PAS des groupes protégés
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - INTERVAL '6 hours'  -- OPTIMISÉ: 6h au lieu de 24h
        AND (protected_group_ids IS NULL OR NOT (group_id = ANY(protected_group_ids)));
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % inactive participants after 6 hours (more responsive)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 2. Supprimer les groupes en attente vides (20 minutes au lieu de 30) MAIS PAS les protégés
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - INTERVAL '20 minutes'  -- OPTIMISÉ: Plus réactif
        AND (protected_group_ids IS NULL OR NOT (id = ANY(protected_group_ids)));
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % empty waiting groups after 20 minutes (more responsive)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 3. NOUVEAU: Nettoyer les groupes planifiés expirés ou annulés
    BEGIN
        DELETE FROM public.groups 
        WHERE is_scheduled = true
        AND (
            -- Groupes planifiés expirés (plus de 4 heures après l'heure prévue, au lieu de 6h)
            (scheduled_for < NOW() - INTERVAL '4 hours' AND status != 'completed')
            OR
            -- Groupes planifiés annulés depuis plus de 12 heures (au lieu de 24h)
            (status = 'cancelled' AND updated_at < NOW() - INTERVAL '12 hours')
        );
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % expired or cancelled scheduled groups (more responsive)', cleanup_count;
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
    
    -- 5. Nettoyer les messages de déclenchement anciens (3 minutes au lieu de 5)
    BEGIN
        DELETE FROM public.group_messages 
        WHERE is_system = true 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND created_at < NOW() - INTERVAL '3 minutes';  -- OPTIMISÉ: Plus réactif
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % old trigger messages (more responsive)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning trigger messages: %', SQLERRM;
    END;
    
    -- 6. Now safe to delete old completed groups (4+ hours after completion, au lieu de 6h)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '4 hours'  -- OPTIMISÉ: Plus réactif
        AND (is_scheduled = false OR is_scheduled IS NULL); -- Protection supplémentaire pour les groupes planifiés
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % old completed groups after 4 hours (more responsive)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    RAISE NOTICE 'OPTIMIZED cleanup completed at % with improved responsiveness', NOW();
END;
$function$;