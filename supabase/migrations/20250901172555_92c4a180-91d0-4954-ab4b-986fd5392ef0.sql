-- Enhanced Admin Permissions - Missing Policies Only
-- This migration safely adds only the missing admin permissions

-- Drop existing conflicting policies if they exist and recreate them properly
DO $$ 
BEGIN
    -- Drop existing admin profile policies if they exist
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
    
    -- Drop existing admin message policies if they exist  
    DROP POLICY IF EXISTS "Admins can delete any message" ON public.group_messages;
    DROP POLICY IF EXISTS "Admins can update any message" ON public.group_messages;
    
    -- Drop existing admin group policies if they exist
    DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
    DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;
    
    -- Drop existing admin history policies if they exist
    DROP POLICY IF EXISTS "Admins can view all outings history" ON public.user_outings_history;
    DROP POLICY IF EXISTS "Admins can update outings history" ON public.user_outings_history;
    DROP POLICY IF EXISTS "Admins can delete outings history" ON public.user_outings_history;
    
    -- Drop existing admin participant policies if they exist
    DROP POLICY IF EXISTS "Admins can delete group participants" ON public.group_participants;
    DROP POLICY IF EXISTS "Admins can update group participants" ON public.group_participants;
END $$;

-- 1. EXTEND USER PROFILE ACCESS FOR ADMINS
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin_user());

-- 2. ADD MESSAGE MODERATION CAPABILITIES
CREATE POLICY "Admins can delete any message"
ON public.group_messages
FOR DELETE
USING (is_admin_user());

CREATE POLICY "Admins can update any message"
ON public.group_messages
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 3. EXTEND GROUP MANAGEMENT ACCESS
CREATE POLICY "Admins can view all groups"
ON public.groups
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Admins can delete groups"
ON public.groups
FOR DELETE
USING (is_admin_user());

-- 4. FULL ACCESS TO OUTINGS HISTORY FOR ANALYTICS
CREATE POLICY "Admins can view all outings history"
ON public.user_outings_history
FOR SELECT
USING (is_admin_user());

CREATE POLICY "Admins can update outings history"
ON public.user_outings_history
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete outings history"
ON public.user_outings_history
FOR DELETE
USING (is_admin_user());

-- 5. PARTICIPANT MANAGEMENT
CREATE POLICY "Admins can delete group participants"
ON public.group_participants
FOR DELETE
USING (is_admin_user());

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

-- Create audit log policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_log;
    DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
END $$;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (is_admin_user());

CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- 7. CREATE COMPREHENSIVE ADMIN STATS FUNCTION
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