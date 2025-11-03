-- =====================================================
-- MIGRATION: Admin Groups Analytics SOTA 2025
-- Description: Vues matérialisées pour analytics avancées
-- =====================================================

-- ============================================
-- 1. VUE MATÉRIALISÉE: Timeline (7 derniers jours)
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_groups_timeline AS
SELECT 
    date_trunc('hour', g.created_at) AS time_bucket,
    COUNT(*) AS groups_created,
    COUNT(*) FILTER (WHERE g.status = 'confirmed') AS groups_confirmed,
    COUNT(*) FILTER (WHERE g.status = 'completed') AS groups_completed,
    AVG(g.current_participants) AS avg_participants,
    AVG(EXTRACT(EPOCH FROM (g.meeting_time - g.created_at)) / 3600) FILTER (WHERE g.meeting_time IS NOT NULL) AS avg_hours_to_confirm
FROM public.groups g
WHERE g.created_at > NOW() - INTERVAL '7 days'
GROUP BY time_bucket
ORDER BY time_bucket DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_groups_timeline_bucket ON admin_groups_timeline(time_bucket);

-- ============================================
-- 2. VUE MATÉRIALISÉE: Distribution géographique
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_groups_geographic_distribution AS
SELECT 
    g.location_name,
    COUNT(*) AS group_count,
    AVG(g.current_participants) AS avg_participants,
    COUNT(*) FILTER (WHERE g.status = 'confirmed' OR g.status = 'completed') AS success_count,
    ROUND((COUNT(*) FILTER (WHERE g.status = 'confirmed' OR g.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) AS success_rate,
    COUNT(DISTINCT g.bar_place_id) FILTER (WHERE g.bar_place_id IS NOT NULL) AS unique_bars,
    AVG(g.latitude) AS avg_latitude,
    AVG(g.longitude) AS avg_longitude
FROM public.groups g
WHERE g.created_at > NOW() - INTERVAL '30 days'
    AND g.location_name IS NOT NULL
GROUP BY g.location_name
ORDER BY group_count DESC
LIMIT 50;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_groups_geo_location ON admin_groups_geographic_distribution(location_name);

-- ============================================
-- 3. VUE MATÉRIALISÉE: Patterns temporels (heatmap 7x24)
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_groups_temporal_patterns AS
SELECT 
    EXTRACT(DOW FROM g.created_at)::INTEGER AS day_of_week, -- 0=Sunday, 6=Saturday
    EXTRACT(HOUR FROM g.created_at)::INTEGER AS hour_of_day,
    COUNT(*) AS group_count,
    AVG(g.current_participants) AS avg_participants,
    COUNT(*) FILTER (WHERE g.status = 'confirmed' OR g.status = 'completed') AS confirmed_count,
    ROUND((COUNT(*) FILTER (WHERE g.status = 'confirmed' OR g.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) AS conversion_rate
FROM public.groups g
WHERE g.created_at > NOW() - INTERVAL '30 days'
GROUP BY day_of_week, hour_of_day
ORDER BY day_of_week, hour_of_day;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_groups_temporal_dow_hour ON admin_groups_temporal_patterns(day_of_week, hour_of_day);

-- ============================================
-- 4. VUE MATÉRIALISÉE: Analyse funnel de conversion
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_groups_funnel_analysis AS
WITH funnel_stages AS (
    SELECT 
        'created' AS stage,
        1 AS stage_order,
        COUNT(*) AS count,
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) AS avg_hours_in_stage
    FROM public.groups
    WHERE created_at > NOW() - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
        'waiting' AS stage,
        2 AS stage_order,
        COUNT(*) AS count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(meeting_time, NOW()) - created_at)) / 3600) AS avg_hours_in_stage
    FROM public.groups
    WHERE created_at > NOW() - INTERVAL '30 days'
        AND status = 'waiting'
    
    UNION ALL
    
    SELECT 
        'confirmed' AS stage,
        3 AS stage_order,
        COUNT(*) AS count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at)) / 3600) AS avg_hours_in_stage
    FROM public.groups
    WHERE created_at > NOW() - INTERVAL '30 days'
        AND status = 'confirmed'
    
    UNION ALL
    
    SELECT 
        'completed' AS stage,
        4 AS stage_order,
        COUNT(*) AS count,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) AS avg_hours_in_stage
    FROM public.groups
    WHERE created_at > NOW() - INTERVAL '30 days'
        AND status = 'completed'
        AND completed_at IS NOT NULL
)
SELECT 
    stage,
    stage_order,
    count,
    avg_hours_in_stage,
    LAG(count) OVER (ORDER BY stage_order) AS previous_count,
    CASE 
        WHEN LAG(count) OVER (ORDER BY stage_order) > 0 
        THEN ROUND((1 - (count::DECIMAL / LAG(count) OVER (ORDER BY stage_order))) * 100, 2)
        ELSE 0
    END AS drop_off_rate
FROM funnel_stages
ORDER BY stage_order;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_groups_funnel_stage ON admin_groups_funnel_analysis(stage);

-- ============================================
-- 5. FONCTION: Refresh toutes les vues matérialisées
-- ============================================
CREATE OR REPLACE FUNCTION refresh_admin_groups_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_groups_timeline;
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_groups_geographic_distribution;
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_groups_temporal_patterns;
    REFRESH MATERIALIZED VIEW CONCURRENTLY admin_groups_funnel_analysis;
    
    RAISE NOTICE 'Refreshed all admin groups analytics views at %', NOW();
END;
$$;

-- ============================================
-- 6. RPC FUNCTIONS pour accès frontend
-- ============================================

-- Timeline data
CREATE OR REPLACE FUNCTION get_admin_groups_timeline(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    time_bucket TIMESTAMP WITH TIME ZONE,
    groups_created BIGINT,
    groups_confirmed BIGINT,
    groups_completed BIGINT,
    avg_participants NUMERIC,
    avg_hours_to_confirm NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM admin_groups_timeline
    WHERE admin_groups_timeline.time_bucket > NOW() - (days_back || ' days')::INTERVAL
    ORDER BY admin_groups_timeline.time_bucket ASC;
END;
$$;

-- Geographic distribution
CREATE OR REPLACE FUNCTION get_admin_groups_geographic(top_limit INTEGER DEFAULT 20)
RETURNS TABLE(
    location_name TEXT,
    group_count BIGINT,
    avg_participants NUMERIC,
    success_count BIGINT,
    success_rate NUMERIC,
    unique_bars BIGINT,
    avg_latitude NUMERIC,
    avg_longitude NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM admin_groups_geographic_distribution
    ORDER BY admin_groups_geographic_distribution.group_count DESC
    LIMIT top_limit;
END;
$$;

-- Temporal heatmap
CREATE OR REPLACE FUNCTION get_admin_groups_heatmap()
RETURNS TABLE(
    day_of_week INTEGER,
    hour_of_day INTEGER,
    group_count BIGINT,
    avg_participants NUMERIC,
    confirmed_count BIGINT,
    conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM admin_groups_temporal_patterns
    ORDER BY day_of_week, hour_of_day;
END;
$$;

-- Funnel analysis
CREATE OR REPLACE FUNCTION get_admin_groups_funnel()
RETURNS TABLE(
    stage TEXT,
    stage_order INTEGER,
    count BIGINT,
    avg_hours_in_stage NUMERIC,
    previous_count BIGINT,
    drop_off_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM admin_groups_funnel_analysis
    ORDER BY admin_groups_funnel_analysis.stage_order;
END;
$$;

-- ============================================
-- 7. Initial refresh des vues
-- ============================================
SELECT refresh_admin_groups_analytics();