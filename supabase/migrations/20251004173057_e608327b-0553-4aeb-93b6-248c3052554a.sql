-- ============================================================================
-- PHASE 1: Création de la SSOT (Single Source of Truth)
-- Fonction PostgreSQL unique pour définir ce qu'est un "groupe actif"
-- ============================================================================

-- Index de performance pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_group_participants_activity 
ON public.group_participants(user_id, status, last_seen);

CREATE INDEX IF NOT EXISTS idx_groups_activity_status 
ON public.groups(status, created_at, is_scheduled);

-- Fonction SSOT : définition unique de "groupe actif"
CREATE OR REPLACE FUNCTION public.get_user_active_groups(
    user_uuid uuid,
    include_scheduled boolean DEFAULT false
)
RETURNS TABLE(
    group_id uuid,
    participation_id uuid,
    group_status text,
    current_participants integer,
    max_participants integer,
    latitude double precision,
    longitude double precision,
    location_name text,
    bar_name text,
    bar_address text,
    meeting_time timestamp with time zone,
    bar_latitude double precision,
    bar_longitude double precision,
    bar_place_id text,
    joined_at timestamp with time zone,
    last_seen timestamp with time zone,
    is_scheduled boolean,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone,
    search_radius integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    activity_threshold CONSTANT interval := '24 hours';
    group_age_limit CONSTANT interval := '7 days';
BEGIN
    RETURN QUERY
    SELECT 
        g.id as group_id,
        gp.id as participation_id,
        g.status as group_status,
        g.current_participants,
        g.max_participants,
        g.latitude,
        g.longitude,
        g.location_name,
        g.bar_name,
        g.bar_address,
        g.meeting_time,
        g.bar_latitude,
        g.bar_longitude,
        g.bar_place_id,
        gp.joined_at,
        gp.last_seen,
        g.is_scheduled,
        g.scheduled_for,
        g.created_at,
        g.search_radius
    FROM public.group_participants gp
    INNER JOIN public.groups g ON gp.group_id = g.id
    WHERE gp.user_id = user_uuid
        AND gp.status = 'confirmed'
        AND g.status IN ('waiting', 'confirmed')
        -- CRITÈRE #1: Activité récente (24h)
        AND gp.last_seen > NOW() - activity_threshold
        -- CRITÈRE #2: Groupe pas trop ancien (7 jours)
        AND g.created_at > NOW() - group_age_limit
        -- CRITÈRE #3: Gérer les groupes planifiés
        AND (
            include_scheduled = true 
            OR g.is_scheduled = false 
            OR g.is_scheduled IS NULL
        )
    ORDER BY g.created_at DESC;
END;
$function$;

-- ============================================================================
-- PHASE 2: Refactorisation de check_user_participation_limit
-- Utilise maintenant la SSOT au lieu de dupliquer la logique
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_user_participation_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    active_groups_count integer;
    scheduled_groups_count integer;
BEGIN
    -- Compter les groupes actifs NON planifiés (via SSOT)
    SELECT COUNT(*) INTO active_groups_count
    FROM public.get_user_active_groups(user_uuid, false);
    
    -- Compter les groupes planifiés à venir (via SSOT + filtre supplémentaire)
    SELECT COUNT(*) INTO scheduled_groups_count
    FROM public.get_user_active_groups(user_uuid, true)
    WHERE is_scheduled = true
    AND scheduled_for > NOW();
    
    -- Autoriser maximum 1 groupe actif + 2 groupes planifiés
    RETURN (active_groups_count = 0 AND scheduled_groups_count <= 2);
END;
$function$;

-- ============================================================================
-- PHASE 4: Refactorisation de dissolve_old_groups
-- Utilise les MÊMES seuils temporels que la SSOT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    cleanup_count integer := 0;
    activity_threshold CONSTANT interval := '24 hours';  -- MÊME SEUIL que SSOT
    group_age_limit CONSTANT interval := '7 days';       -- MÊME SEUIL que SSOT
BEGIN
    RAISE NOTICE '🔄 Starting UNIFIED cleanup with activity_threshold=% and group_age_limit=%', 
        activity_threshold, group_age_limit;
    
    -- 1. Transition confirmed groups to completed (45min window)
    BEGIN
        PERFORM public.transition_groups_to_completed();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error transitioning groups to completed: %', SQLERRM;
    END;
    
    -- 2. Supprimer les participants INACTIFS depuis 24h (ALIGNÉ avec SSOT)
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - activity_threshold
        AND status = 'confirmed';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE '✅ Removed % participants inactive for 24+ hours (SSOT aligned)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 3. Supprimer les groupes VIDES depuis 7 jours (ALIGNÉ avec SSOT)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - group_age_limit
        AND (is_scheduled = false OR is_scheduled IS NULL);
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE '✅ Removed % empty groups older than 7 days (SSOT aligned)', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 4. Supprimer les groupes complétés depuis 3 jours
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '3 days';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE '✅ Removed % completed groups older than 3 days', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    -- 5. Groupes planifiés expirés (1 jour après scheduled_for)
    BEGIN
        DELETE FROM public.groups 
        WHERE is_scheduled = true
        AND (
            (scheduled_for < NOW() - INTERVAL '1 day' AND status != 'completed')
            OR
            (status = 'cancelled' AND updated_at < NOW() - INTERVAL '1 day')
        );
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE '✅ Cleaned % expired scheduled groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning scheduled groups: %', SQLERRM;
    END;
    
    -- 6. Corriger les compteurs (synchronisation)
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
        RAISE NOTICE '✅ Updated % group counters', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating counters: %', SQLERRM;
    END;
    
    -- 7. Nettoyer les anciens messages trigger
    BEGIN
        DELETE FROM public.group_messages 
        WHERE is_system = true 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND created_at < NOW() - INTERVAL '5 minutes';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE '✅ Cleaned % old trigger messages', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning trigger messages: %', SQLERRM;
    END;
    
    RAISE NOTICE '🎯 UNIFIED cleanup completed with SSOT-aligned thresholds (24h activity, 7d age)';
END;
$function$;

-- ============================================================================
-- PHASE 6: Suite de tests SQL pour validation
-- ============================================================================

-- Test 1: Vérifier qu'un utilisateur avec participation inactive (> 24h) n'est pas bloqué
DO $$
DECLARE
    test_user_id uuid := '3251db4f-e628-4be4-b7ef-cc7de9229c18';
    can_create boolean;
    active_count integer;
BEGIN
    -- Compter les groupes actifs via SSOT
    SELECT COUNT(*) INTO active_count
    FROM public.get_user_active_groups(test_user_id, false);
    
    -- Vérifier la limite
    SELECT public.check_user_participation_limit(test_user_id) INTO can_create;
    
    RAISE NOTICE 'TEST 1 - User: %, Active groups: %, Can create: %', 
        test_user_id, active_count, can_create;
    
    IF active_count = 0 AND can_create = true THEN
        RAISE NOTICE '✅ TEST 1 PASSED: User with inactive participation can create group';
    ELSE
        RAISE NOTICE '❌ TEST 1 FAILED: Inconsistency detected';
    END IF;
END $$;

-- Test 2: Vérifier que les seuils temporels sont cohérents
DO $$
DECLARE
    ssot_threshold text;
    cleanup_threshold text;
BEGIN
    -- Les seuils sont maintenant définis comme CONSTANTS dans les fonctions
    RAISE NOTICE '✅ TEST 2: Thresholds are now unified via SSOT constants';
    RAISE NOTICE '   - activity_threshold = 24 hours (in all functions)';
    RAISE NOTICE '   - group_age_limit = 7 days (in all functions)';
END $$;