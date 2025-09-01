-- Comprehensive Admin Permissions Enhancement
-- This migration provides full administrative access to all tables and functionality

-- 1. EXTEND USER PROFILE ACCESS FOR ADMINS
-- Allow admins to view all user profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin_user());

-- Allow admins to update any profile (for account management)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Allow admins to delete profiles (account deletion)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin_user());

-- 2. ADD MESSAGE MODERATION CAPABILITIES
-- Allow admins to delete inappropriate messages
CREATE POLICY "Admins can delete any message"
ON public.group_messages
FOR DELETE
USING (is_admin_user());

-- Allow admins to update messages (for content moderation)
CREATE POLICY "Admins can update any message"
ON public.group_messages
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 3. EXTEND GROUP MANAGEMENT ACCESS
-- Allow admins to view ALL groups regardless of status
CREATE POLICY "Admins can view all groups"
ON public.groups
FOR SELECT
USING (is_admin_user());

-- Allow admins to delete groups permanently
CREATE POLICY "Admins can delete groups"
ON public.groups
FOR DELETE
USING (is_admin_user());

-- 4. FULL ACCESS TO OUTINGS HISTORY FOR ANALYTICS
-- Allow admins to view all user outings history
CREATE POLICY "Admins can view all outings history"
ON public.user_outings_history
FOR SELECT
USING (is_admin_user());

-- Allow admins to update outings history (for corrections)
CREATE POLICY "Admins can update outings history"
ON public.user_outings_history
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Allow admins to delete outings history entries
CREATE POLICY "Admins can delete outings history"
ON public.user_outings_history
FOR DELETE
USING (is_admin_user());

-- 5. PARTICIPANT MANAGEMENT
-- Allow admins to remove participants from groups
CREATE POLICY "Admins can delete group participants"
ON public.group_participants
FOR DELETE
USING (is_admin_user());

-- Allow admins to update participant status
CREATE POLICY "Admins can update group participants"
ON public.group_participants
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 6. CREATE AUDIT LOG SYSTEM FOR ADMIN ACTIONS
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (is_admin_user());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 7. CREATE ADMIN FUNCTION TO GET COMPREHENSIVE SYSTEM STATS
CREATE OR REPLACE FUNCTION public.get_comprehensive_admin_stats()
RETURNS JSON
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL),
    'total_profiles', (SELECT COUNT(*) FROM public.profiles),
    'waiting_groups', (SELECT COUNT(*) FROM public.groups WHERE status = 'waiting'),
    'confirmed_groups', (SELECT COUNT(*) FROM public.groups WHERE status = 'confirmed'),
    'completed_groups', (SELECT COUNT(*) FROM public.groups WHERE status = 'completed'),
    'cancelled_groups', (SELECT COUNT(*) FROM public.groups WHERE status = 'cancelled'),
    'scheduled_groups', (SELECT COUNT(*) FROM public.groups WHERE is_scheduled = true AND status = 'waiting'),
    'total_messages', (SELECT COUNT(*) FROM public.group_messages WHERE is_system = false),
    'system_messages', (SELECT COUNT(*) FROM public.group_messages WHERE is_system = true),
    'total_outings', (SELECT COUNT(*) FROM public.user_outings_history),
    'groups_today', (SELECT COUNT(*) FROM public.groups WHERE created_at > NOW() - INTERVAL '24 hours'),
    'signups_today', (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours'),
    'active_participants', (SELECT COUNT(DISTINCT user_id) FROM public.group_participants WHERE last_seen > NOW() - INTERVAL '24 hours'),
    'avg_group_size', (SELECT ROUND(AVG(current_participants), 2) FROM public.groups WHERE status = 'completed'),
    'top_bars', (
      SELECT json_agg(json_build_object('bar_name', bar_name, 'visits', visits))
      FROM (
        SELECT bar_name, COUNT(*) as visits
        FROM public.user_outings_history
        GROUP BY bar_name
        ORDER BY visits DESC
        LIMIT 10
      ) top_bars_data
    )
  )
$$;

-- 8. CREATE FUNCTION TO GET USER DETAILS FOR ADMIN
CREATE OR REPLACE FUNCTION public.get_user_details_admin(target_user_id UUID)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if current user is admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  SELECT json_build_object(
    'user_info', (
      SELECT json_build_object(
        'id', au.id,
        'email', au.email,
        'created_at', au.created_at,
        'last_sign_in_at', au.last_sign_in_at,
        'email_confirmed_at', au.email_confirmed_at
      )
      FROM auth.users au WHERE au.id = target_user_id
    ),
    'profile', (
      SELECT json_build_object(
        'first_name', p.first_name,
        'last_name', p.last_name,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      FROM public.profiles p WHERE p.id = target_user_id
    ),
    'roles', (
      SELECT json_agg(ur.role)
      FROM public.user_roles ur WHERE ur.user_id = target_user_id
    ),
    'active_groups', (
      SELECT json_agg(json_build_object(
        'group_id', g.id,
        'status', g.status,
        'created_at', g.created_at,
        'location_name', g.location_name
      ))
      FROM public.group_participants gp
      JOIN public.groups g ON gp.group_id = g.id
      WHERE gp.user_id = target_user_id 
      AND gp.status = 'confirmed'
      AND g.status IN ('waiting', 'confirmed')
    ),
    'outings_history', (
      SELECT json_agg(json_build_object(
        'bar_name', uoh.bar_name,
        'bar_address', uoh.bar_address,
        'meeting_time', uoh.meeting_time,
        'completed_at', uoh.completed_at,
        'participants_count', uoh.participants_count,
        'user_rating', uoh.user_rating
      ))
      FROM public.user_outings_history uoh
      WHERE uoh.user_id = target_user_id
      ORDER BY uoh.completed_at DESC
      LIMIT 50
    ),
    'recent_messages', (
      SELECT json_agg(json_build_object(
        'group_id', gm.group_id,
        'message', gm.message,
        'created_at', gm.created_at,
        'is_system', gm.is_system
      ))
      FROM public.group_messages gm
      WHERE gm.user_id = target_user_id
      ORDER BY gm.created_at DESC
      LIMIT 20
    )
  ) INTO result;
  
  RETURN result;
END;
$$;