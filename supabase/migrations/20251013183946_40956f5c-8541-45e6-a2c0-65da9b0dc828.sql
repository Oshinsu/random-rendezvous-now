-- Phase 1: Calculer les health scores manquants
DO $$
DECLARE
    user_rec RECORD;
    calculated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== PHASE 1: Calculating missing health scores ===';
    
    FOR user_rec IN 
        SELECT u.id
        FROM auth.users u
        LEFT JOIN crm_user_health h ON u.id = h.user_id
        WHERE h.user_id IS NULL
        AND u.deleted_at IS NULL
    LOOP
        BEGIN
            PERFORM public.calculate_user_health_score(user_rec.id);
            calculated_count := calculated_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error calculating health for user %: %', user_rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Phase 1 complete: % calculated, % errors', calculated_count, error_count;
END $$;

-- Phase 2: Recalculer tous les health scores
DO $$
DECLARE
    user_rec RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== PHASE 2: Recalculating all health scores ===';
    
    FOR user_rec IN 
        SELECT id FROM auth.users WHERE deleted_at IS NULL
    LOOP
        BEGIN
            PERFORM public.calculate_user_health_score(user_rec.id);
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error for user %: %', user_rec.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Phase 2 complete: % success, % errors', success_count, error_count;
END $$;

-- Phase 3: Nettoyer et réassigner tous les segments
DO $$
DECLARE
    user_rec RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== PHASE 3: Cleaning and reassigning all segments ===';
    
    -- Nettoyer les anciens segments
    DELETE FROM crm_user_segment_memberships;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % old segment memberships', deleted_count;
    
    -- Réassigner tous les segments
    FOR user_rec IN 
        SELECT user_id FROM public.crm_user_health
    LOOP
        BEGIN
            PERFORM public.assign_user_segments(user_rec.user_id);
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error assigning segments for user %: %', user_rec.user_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Phase 3 complete: % success, % errors', success_count, error_count;
END $$;

-- Phase 4: Vérifier les résultats
DO $$
DECLARE
    segment_rec RECORD;
    users_without_segment INTEGER;
    total_users INTEGER;
BEGIN
    RAISE NOTICE '=== PHASE 4: Verification ===';
    
    -- Total users
    SELECT COUNT(*) INTO total_users FROM auth.users WHERE deleted_at IS NULL;
    RAISE NOTICE 'Total active users: %', total_users;
    
    -- Distribution des segments
    RAISE NOTICE 'Segment distribution:';
    FOR segment_rec IN 
        SELECT 
            s.segment_name,
            s.segment_key,
            COUNT(m.user_id) as user_count
        FROM crm_user_segments s
        LEFT JOIN crm_user_segment_memberships m ON s.id = m.segment_id
        GROUP BY s.id, s.segment_name, s.segment_key
        ORDER BY user_count DESC
    LOOP
        RAISE NOTICE '  - %: % users', segment_rec.segment_name, segment_rec.user_count;
    END LOOP;
    
    -- Users sans segment
    SELECT COUNT(*) INTO users_without_segment
    FROM auth.users u
    LEFT JOIN crm_user_segment_memberships m ON u.id = m.user_id
    WHERE u.deleted_at IS NULL
    AND m.user_id IS NULL;
    
    RAISE NOTICE 'Users without any segment: %', users_without_segment;
    
    IF users_without_segment > 0 THEN
        RAISE WARNING 'Some users are missing segment assignment!';
    ELSE
        RAISE NOTICE '✅ All users have been assigned to segments successfully!';
    END IF;
END $$;