-- Fonction pour récupérer tous les utilisateurs avec leurs données complètes (admin seulement)
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  first_name text,
  last_name text,
  active_groups_count integer,
  total_outings_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    p.first_name,
    p.last_name,
    COALESCE(ag.active_count, 0)::integer as active_groups_count,
    COALESCE(oh.outings_count, 0)::integer as total_outings_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN (
    SELECT 
      gp.user_id,
      COUNT(*) as active_count
    FROM public.group_participants gp
    JOIN public.groups g ON gp.group_id = g.id
    WHERE gp.status = 'confirmed'
    AND g.status IN ('waiting', 'confirmed')
    GROUP BY gp.user_id
  ) ag ON au.id = ag.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as outings_count
    FROM public.user_outings_history
    GROUP BY user_id
  ) oh ON au.id = oh.user_id
  ORDER BY au.created_at DESC;
END;
$$;