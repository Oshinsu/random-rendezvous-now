-- CORRECTION SUPABASE: Nettoyer les données corrompues et corriger la logique métier

-- 1. Créer quelques groupes de test pour débloquer la situation (Paris, Lyon, Marseille)
INSERT INTO public.groups (
    status, 
    max_participants, 
    current_participants, 
    latitude, 
    longitude, 
    location_name, 
    search_radius,
    city_name,
    created_by_user_id
) VALUES 
-- Paris République
('waiting', 5, 1, 48.8673, 2.3631, 'Paris République', 12000, 'Paris', (SELECT id FROM profiles LIMIT 1)),
-- Lyon Part-Dieu  
('waiting', 5, 2, 45.7640, 4.8357, 'Lyon Part-Dieu', 12000, 'Lyon', (SELECT id FROM profiles LIMIT 1)),
-- Marseille Vieux-Port
('waiting', 5, 1, 43.2961, 5.3699, 'Marseille Vieux-Port', 12000, 'Marseille', (SELECT id FROM profiles LIMIT 1));

-- 2. Créer des participants de test pour ces groupes
INSERT INTO public.group_participants (
    group_id,
    user_id, 
    status,
    latitude,
    longitude,
    location_name
)
SELECT 
    g.id,
    p.id,
    'confirmed',
    g.latitude,
    g.longitude, 
    g.location_name
FROM public.groups g
CROSS JOIN (SELECT id FROM public.profiles LIMIT 3) p
WHERE g.id IN (SELECT id FROM public.groups ORDER BY created_at DESC LIMIT 3);

-- 3. CORRIGER LA LOGIQUE MÉTIER: Modifier la fonction de recherche de groupes compatibles
CREATE OR REPLACE FUNCTION public.find_compatible_group_fixed(
    user_latitude double precision, 
    user_longitude double precision,
    search_radius integer DEFAULT 12000
) 
RETURNS TABLE(
    id uuid,
    status text,
    current_participants integer,
    max_participants integer,
    latitude double precision,
    longitude double precision,
    location_name text,
    distance_meters double precision
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.status,
        g.current_participants,
        g.max_participants,
        g.latitude,
        g.longitude,
        g.location_name,
        public.calculate_distance(user_latitude, user_longitude, g.latitude, g.longitude) as distance_meters
    FROM public.groups g
    WHERE g.status = 'waiting'
        AND g.current_participants < g.max_participants
        AND g.current_participants >= 1
        AND g.created_at > NOW() - INTERVAL '3 hours'
        AND public.calculate_distance(user_latitude, user_longitude, g.latitude, g.longitude) <= search_radius
        AND (g.is_scheduled = false OR g.is_scheduled IS NULL)
    ORDER BY g.created_at DESC
    LIMIT 5;
END;
$$;

-- 4. Corriger les compteurs de participants pour les groupes créés
UPDATE public.groups 
SET current_participants = (
    SELECT COUNT(*) 
    FROM public.group_participants 
    WHERE group_id = groups.id 
    AND status = 'confirmed'
)
WHERE id IN (SELECT id FROM public.groups ORDER BY created_at DESC LIMIT 3);

-- 5. Nettoyer les anciens messages système orphelins
DELETE FROM public.group_messages 
WHERE is_system = true 
AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
AND created_at < NOW() - INTERVAL '1 hour';