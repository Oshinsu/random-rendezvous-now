-- Update the PostgreSQL function find_compatible_group_fixed to use 25km default
CREATE OR REPLACE FUNCTION public.find_compatible_group_fixed(user_latitude double precision, user_longitude double precision, search_radius integer DEFAULT 25000)
 RETURNS TABLE(id uuid, status text, current_participants integer, max_participants integer, latitude double precision, longitude double precision, location_name text, distance_meters double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$