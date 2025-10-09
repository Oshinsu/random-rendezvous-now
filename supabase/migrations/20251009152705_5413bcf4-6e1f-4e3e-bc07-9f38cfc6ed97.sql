-- Étape 1: Ajouter les colonnes de connexion à crm_user_health
ALTER TABLE public.crm_user_health
ADD COLUMN IF NOT EXISTS days_since_last_login INTEGER,
ADD COLUMN IF NOT EXISTS total_logins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS never_logged_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Étape 2: Créer la fonction améliorée calculate_user_health_score avec données de connexion
CREATE OR REPLACE FUNCTION public.calculate_user_health_score(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
BEGIN
    -- Get user creation and last login from auth.users
    SELECT created_at, last_sign_in_at
    INTO user_created_at, last_login
    FROM auth.users
    WHERE id = target_user_id;
    
    -- Calculate days since signup
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
    
    -- Calculate health score (0-100) avec intégration des connexions
    health_score := 50; -- Base score
    
    -- CRITÈRE 1: Connexion
    IF never_logged_in THEN
        -- Jamais connecté = score très bas
        IF days_since_signup > 30 THEN
            health_score := 10; -- Zombie total
        ELSIF days_since_signup > 14 THEN
            health_score := 20; -- Compte mort
        ELSIF days_since_signup > 7 THEN
            health_score := 30; -- Inscrit mais jamais venu
        ELSE
            health_score := 40; -- Nouveau, on attend
        END IF;
    ELSE
        -- Connecté au moins une fois
        -- Bonus pour connexion récente
        IF days_since_last_login <= 3 THEN
            health_score := health_score + 20; -- Très actif
        ELSIF days_since_last_login <= 7 THEN
            health_score := health_score + 10; -- Actif
        ELSIF days_since_last_login <= 30 THEN
            health_score := health_score - 10; -- Un peu inactif
        ELSE
            health_score := health_score - 30; -- Très inactif
        END IF;
    END IF;
    
    -- CRITÈRE 2: Activité (sorties)
    IF total_outings > 0 THEN
        health_score := health_score + LEAST(total_outings * 5, 30);
    END IF;
    
    -- CRITÈRE 3: Inactivité récente
    IF days_since_last_activity IS NOT NULL THEN
        IF days_since_last_activity > 30 THEN
            health_score := health_score - 20;
        ELSIF days_since_last_activity > 14 THEN
            health_score := health_score - 10;
        END IF;
    END IF;
    
    -- CRITÈRE 4: Régularité
    IF avg_days_between IS NOT NULL AND avg_days_between < 14 THEN
        health_score := health_score + 15;
    END IF;
    
    -- Clamp between 0-100
    health_score := GREATEST(0, LEAST(100, health_score));
    
    -- Update or insert health record
    INSERT INTO public.crm_user_health (
        user_id, health_score, churn_risk, last_activity_at,
        total_groups, total_outings, days_since_signup,
        days_since_last_activity, avg_days_between_outings,
        days_since_last_login, never_logged_in, last_login_at,
        calculated_at, updated_at
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
        NOW(),
        NOW()
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
        calculated_at = NOW(),
        updated_at = NOW();
    
    RETURN health_score;
END;
$function$;

-- Étape 3: Créer les nouveaux segments basés sur les connexions
INSERT INTO public.crm_user_segments (segment_key, segment_name, description, color, criteria)
VALUES 
    ('zombies', 'Zombies 🧟', 'Inscrits mais jamais connectés (30+ jours)', '#dc2626', '{"never_logged_in": true, "days_since_signup_gt": 30}'),
    ('curious_active', 'Curieux Actifs 👀', 'Connectés récemment mais aucune sortie', '#f59e0b', '{"days_since_last_login_lte": 7, "total_outings": 0}'),
    ('sleeping_engaged', 'Endormis Engagés 😴', 'Utilisateurs engagés mais inactifs', '#8b5cf6', '{"total_outings_gte": 2, "days_since_last_login_gt": 30}'),
    ('super_active', 'Super Actifs ⚡', 'Connexions fréquentes et multiples sorties', '#10b981', '{"days_since_last_login_lte": 3, "total_outings_gte": 3}')
ON CONFLICT (segment_key) DO UPDATE SET
    segment_name = EXCLUDED.segment_name,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    criteria = EXCLUDED.criteria;

-- Étape 4: Créer la fonction assign_user_segments avec logique de connexion
CREATE OR REPLACE FUNCTION public.assign_user_segments(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_health RECORD;
    segment_record RECORD;
BEGIN
    -- Get user health data
    SELECT * INTO user_health
    FROM public.crm_user_health
    WHERE user_id = target_user_id;
    
    IF user_health IS NULL THEN
        RETURN;
    END IF;
    
    -- Clear existing segment memberships
    DELETE FROM public.crm_user_segment_memberships
    WHERE user_id = target_user_id;
    
    -- Assign segments based on health data
    
    -- Zombies: jamais connecté + 30+ jours
    IF user_health.never_logged_in AND user_health.days_since_signup > 30 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'zombies';
    END IF;
    
    -- Super Actifs: connexion récente + multiples sorties
    IF user_health.days_since_last_login IS NOT NULL 
       AND user_health.days_since_last_login <= 3 
       AND user_health.total_outings >= 3 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'super_active';
    END IF;
    
    -- Curieux Actifs: connecté récemment mais pas de sortie
    IF user_health.days_since_last_login IS NOT NULL 
       AND user_health.days_since_last_login <= 7 
       AND user_health.total_outings = 0 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'curious_active';
    END IF;
    
    -- Endormis Engagés: sorties passées mais inactif maintenant
    IF user_health.total_outings >= 2 
       AND user_health.days_since_last_login IS NOT NULL
       AND user_health.days_since_last_login > 30 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'sleeping_engaged';
    END IF;
    
    -- Segments existants (active, dormant, etc.)
    IF user_health.total_outings >= 2 
       AND user_health.days_since_last_activity IS NOT NULL
       AND user_health.days_since_last_activity <= 14 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'active';
    END IF;
    
    IF user_health.total_outings >= 1 
       AND user_health.days_since_last_activity IS NOT NULL
       AND user_health.days_since_last_activity > 30 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'dormant';
    END IF;
    
    IF user_health.days_since_signup <= 7 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'new_users';
    END IF;
    
    IF user_health.total_outings = 1 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'one_timer';
    END IF;
    
    IF user_health.churn_risk IN ('high', 'critical') THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'churn_risk';
    END IF;
    
    IF user_health.total_outings >= 5 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'super_users';
    END IF;
END;
$function$;