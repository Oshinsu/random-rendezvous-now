-- Corriger la fonction assign_user_segments avec des critères plus réalistes
CREATE OR REPLACE FUNCTION public.assign_user_segments(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    health_record RECORD;
BEGIN
    SELECT * INTO health_record
    FROM public.crm_user_health
    WHERE user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Nettoyer les anciens segments
    DELETE FROM public.crm_user_segment_memberships
    WHERE user_id = target_user_id;
    
    -- 🔴 Priority 1: Zombies (EXCLUSIF - si zombie, on s'arrête là)
    IF health_record.never_logged_in AND health_record.days_since_signup > 14 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'zombie_users';
        RETURN;
    END IF;
    
    -- 🔵 Priority 2: Nouveaux (< 7 jours)
    IF health_record.days_since_signup <= 7 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'new_users';
    END IF;
    
    -- 🟢 Priority 3: Actifs (CRITÈRES ASSOUPLIS)
    -- Connecté < 30j OU au moins 1 sortie
    IF (health_record.days_since_last_login IS NOT NULL AND health_record.days_since_last_login <= 30)
       OR (health_record.total_outings >= 1) THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'active';
    END IF;
    
    -- 🟡 Priority 4: Dormants (CRITÈRES CORRIGÉS)
    -- Pas connecté depuis 30+ jours ET pas de sortie récente
    IF health_record.days_since_last_login IS NOT NULL 
       AND health_record.days_since_last_login > 30 
       AND (health_record.total_outings = 0 
            OR (health_record.days_since_last_activity IS NOT NULL 
                AND health_record.days_since_last_activity > 30)) THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'dormant';
    END IF;
    
    -- 🔴 Priority 5: Risque Critique
    IF health_record.churn_risk = 'critical' OR health_record.health_score < 30 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'churn_risk';
    END IF;
END;
$$;

-- Réassigner tous les segments avec la nouvelle logique
DO $$
DECLARE
    user_rec RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Reassigning all segments with new logic ===';
    
    -- Nettoyer tous les anciens segments
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
    
    RAISE NOTICE 'Reassignment complete: % success, % errors', success_count, error_count;
END $$;

-- Vérifier la nouvelle distribution
DO $$
DECLARE
    segment_rec RECORD;
    users_without_segment INTEGER;
    total_users INTEGER;
BEGIN
    RAISE NOTICE '=== New Segment Distribution ===';
    
    SELECT COUNT(*) INTO total_users FROM auth.users WHERE deleted_at IS NULL;
    RAISE NOTICE 'Total active users: %', total_users;
    
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
    
    SELECT COUNT(*) INTO users_without_segment
    FROM auth.users u
    LEFT JOIN crm_user_segment_memberships m ON u.id = m.user_id
    WHERE u.deleted_at IS NULL
    AND m.user_id IS NULL;
    
    RAISE NOTICE 'Users without any segment: %', users_without_segment;
    
    IF users_without_segment > 0 THEN
        RAISE WARNING '⚠️ Some users are missing segment assignment!';
    ELSE
        RAISE NOTICE '✅ All users have been assigned to segments successfully!';
    END IF;
END $$;