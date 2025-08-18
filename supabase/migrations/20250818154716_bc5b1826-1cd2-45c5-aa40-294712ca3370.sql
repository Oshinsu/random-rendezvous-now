-- Create function to get accurate signup statistics from auth.users
CREATE OR REPLACE FUNCTION public.get_signup_stats(period_start timestamp with time zone, period_end timestamp with time zone)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL),
    'signups_in_period', (
      SELECT COUNT(*) 
      FROM auth.users 
      WHERE created_at >= period_start 
      AND created_at <= period_end 
      AND deleted_at IS NULL
    ),
    'active_users_in_period', (
      SELECT COUNT(DISTINCT gp.user_id)
      FROM public.group_participants gp
      WHERE gp.last_seen >= period_start 
      AND gp.last_seen <= period_end
    )
  )
$function$;