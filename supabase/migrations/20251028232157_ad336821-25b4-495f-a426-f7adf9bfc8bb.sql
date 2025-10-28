-- Améliorer le calcul du health score pour être plus pertinent
-- Prendre en compte : ratio connexions/créations de groupes, horaires de connexion, nouveaux vs anciens

CREATE OR REPLACE FUNCTION public.calculate_user_health_score(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    days_since_signup INTEGER;
    days_since_last_activity INTEGER;
    days_since_last_login INTEGER;
    total_groups INTEGER;
    total_outings INTEGER;
    avg_days_between NUMERIC;
    health_score INTEGER := 50;
    last_login TIMESTAMP WITH TIME ZONE;
    user_created_at TIMESTAMP WITH TIME ZONE;
    never_logged_in BOOLEAN := false;
    total_logins INTEGER := 0;
    peak_hour_connections INTEGER := 0;
    off_peak_connections INTEGER := 0;
    connection_quality_score INTEGER := 0;
BEGIN
    -- Get user creation and last login
    SELECT created_at, last_sign_in_at
    INTO user_created_at, last_login
    FROM auth.users
    WHERE id = target_user_id;
    
    days_since_signup := EXTRACT(DAY FROM NOW() - user_created_at)::INTEGER;
    
    -- Check if user never logged in
    IF last_login IS NULL THEN
        never_logged_in := true;
        days_since_last_login := NULL;
    ELSE
        days_since_last_login := EXTRACT(DAY FROM NOW() - last_login)::INTEGER;
    END IF;
    
    -- Get last activity from group participations
    SELECT EXTRACT(DAY FROM NOW() - MAX(last_seen))::INTEGER
    INTO days_since_last_activity
    FROM public.group_participants
    WHERE user_id = target_user_id;
    
    -- Get total groups and outings
    SELECT COUNT(DISTINCT group_id)
    INTO total_groups
    FROM public.group_participants
    WHERE user_id = target_user_id AND status = 'confirmed';
    
    SELECT COUNT(*)
    INTO total_outings
    FROM public.user_outings_history
    WHERE user_id = target_user_id;
    
    -- Calculate average days between outings
    SELECT AVG(diff_days)
    INTO avg_days_between
    FROM (
        SELECT EXTRACT(DAY FROM completed_at - LAG(completed_at) OVER (ORDER BY completed_at))::NUMERIC as diff_days
        FROM public.user_outings_history
        WHERE user_id = target_user_id
    ) t
    WHERE diff_days IS NOT NULL;
    
    -- NOUVEAU: Analyser les horaires de connexion (18h-22h = peak hours)
    SELECT 
        COUNT(CASE WHEN EXTRACT(HOUR FROM last_seen) BETWEEN 18 AND 22 THEN 1 END),
        COUNT(CASE WHEN EXTRACT(HOUR FROM last_seen) NOT BETWEEN 18 AND 22 THEN 1 END)
    INTO peak_hour_connections, off_peak_connections
    FROM public.group_participants
    WHERE user_id = target_user_id
        AND last_seen > NOW() - INTERVAL '30 days';
    
    -- Calculate health score
    health_score := 50; -- Base
    
    -- CRITÈRE 1: Connexion et engagement
    IF never_logged_in THEN
        IF days_since_signup > 30 THEN
            health_score := 10; -- Zombie
        ELSIF days_since_signup > 14 THEN
            health_score := 20;
        ELSIF days_since_signup > 7 THEN
            health_score := 30;
        ELSE
            health_score := 40; -- Nouveau, on attend
        END IF;
    ELSE
        -- Bonus connexion récente
        IF days_since_last_login <= 3 THEN
            health_score := health_score + 20;
        ELSIF days_since_last_login <= 7 THEN
            health_score := health_score + 10;
        ELSIF days_since_last_login <= 30 THEN
            health_score := health_score - 10;
        ELSE
            health_score := health_score - 30;
        END IF;
    END IF;
    
    -- CRITÈRE 2: Qualité de l'engagement (horaires)
    IF peak_hour_connections > 0 THEN
        connection_quality_score := LEAST((peak_hour_connections * 100 / GREATEST(peak_hour_connections + off_peak_connections, 1)), 100);
        -- Bonus si > 70% des connexions aux heures de pointe
        IF connection_quality_score >= 70 THEN
            health_score := health_score + 15;
        ELSIF connection_quality_score >= 50 THEN
            health_score := health_score + 10;
        ELSIF connection_quality_score >= 30 THEN
            health_score := health_score + 5;
        ELSE
            -- Malus si connexion hors horaires de pointe
            health_score := health_score - 5;
        END IF;
    END IF;
    
    -- CRITÈRE 3: Sorties réelles (convertit)
    IF total_outings > 0 THEN
        health_score := health_score + LEAST(total_outings * 5, 30);
    END IF;
    
    -- CRITÈRE 4: Ratio groupes créés vs sorties réussies
    IF total_groups > 0 AND total_outings > 0 THEN
        -- Bon ratio = plus de 50% des groupes aboutissent
        IF (total_outings::FLOAT / total_groups) >= 0.5 THEN
            health_score := health_score + 10;
        END IF;
    ELSIF total_groups > 3 AND total_outings = 0 THEN
        -- Beaucoup de groupes créés mais aucune sortie = problème
        health_score := health_score - 15;
    END IF;
    
    -- CRITÈRE 5: Inactivité récente
    IF days_since_last_activity IS NOT NULL THEN
        IF days_since_last_activity > 30 THEN
            health_score := health_score - 20;
        ELSIF days_since_last_activity > 14 THEN
            health_score := health_score - 10;
        END IF;
    END IF;
    
    -- CRITÈRE 6: Régularité
    IF avg_days_between IS NOT NULL AND avg_days_between < 14 THEN
        health_score := health_score + 15;
    END IF;
    
    -- CRITÈRE 7: Nouveaux utilisateurs (période d'adaptation)
    IF days_since_signup <= 7 AND total_outings = 0 THEN
        -- Période de grâce pour nouveaux
        health_score := GREATEST(health_score, 40);
    END IF;
    
    -- Clamp 0-100
    health_score := GREATEST(0, LEAST(100, health_score));
    
    -- Update health record
    INSERT INTO public.crm_user_health (
        user_id, health_score, churn_risk, last_activity_at,
        total_groups, total_outings, days_since_signup,
        days_since_last_activity, avg_days_between_outings,
        days_since_last_login, never_logged_in, last_login_at,
        total_logins, calculated_at, updated_at, metadata
    )
    VALUES (
        target_user_id,
        health_score,
        CASE
            WHEN health_score >= 70 THEN 'low'
            WHEN health_score >= 50 THEN 'medium'
            WHEN health_score >= 30 THEN 'high'
            ELSE 'critical'
        END,
        NOW() - (COALESCE(days_since_last_activity, 0) || ' days')::INTERVAL,
        total_groups,
        total_outings,
        days_since_signup,
        days_since_last_activity,
        avg_days_between,
        days_since_last_login,
        never_logged_in,
        last_login,
        COALESCE(peak_hour_connections + off_peak_connections, 0),
        NOW(),
        NOW(),
        jsonb_build_object(
            'peak_hour_connections', peak_hour_connections,
            'off_peak_connections', off_peak_connections,
            'connection_quality_score', connection_quality_score
        )
    )
    ON CONFLICT (user_id) DO UPDATE SET
        health_score = EXCLUDED.health_score,
        churn_risk = EXCLUDED.churn_risk,
        last_activity_at = EXCLUDED.last_activity_at,
        total_groups = EXCLUDED.total_groups,
        total_outings = EXCLUDED.total_outings,
        days_since_signup = EXCLUDED.days_since_signup,
        days_since_last_activity = EXCLUDED.days_since_last_activity,
        avg_days_between_outings = EXCLUDED.avg_days_between_outings,
        days_since_last_login = EXCLUDED.days_since_last_login,
        never_logged_in = EXCLUDED.never_logged_in,
        last_login_at = EXCLUDED.last_login_at,
        total_logins = EXCLUDED.total_logins,
        calculated_at = NOW(),
        updated_at = NOW(),
        metadata = EXCLUDED.metadata;
    
    RETURN health_score;
END;
$$;