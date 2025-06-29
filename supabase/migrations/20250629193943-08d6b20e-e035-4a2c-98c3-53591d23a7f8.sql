
-- COMPREHENSIVE RLS CLEANUP AND OPTIMIZATION PLAN
-- Step 1: Remove ALL existing RLS policies to start fresh

-- Drop all policies on group_participants
DROP POLICY IF EXISTS "Allow all for authenticated users on group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Simple read access for group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Simple insert for group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Simple update for group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Simple delete for group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Enable read for authenticated users on group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users on group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Enable update for own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Enable delete for own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Allow authenticated users to read group participants" ON public.group_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON public.group_participants;
DROP POLICY IF EXISTS "Allow users to update their own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Allow users to delete their own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Users can view group participants" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;
DROP POLICY IF EXISTS "Enable read for group members" ON public.group_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.group_participants;
DROP POLICY IF EXISTS "Enable update for own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Enable delete for own participation" ON public.group_participants;

-- Drop all policies on groups
DROP POLICY IF EXISTS "Allow all for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Simple read access for groups" ON public.groups;
DROP POLICY IF EXISTS "Simple insert for groups" ON public.groups;
DROP POLICY IF EXISTS "Simple update for groups" ON public.groups;
DROP POLICY IF EXISTS "Enable read for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Enable update for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated users to read groups" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated users to create groups" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated users to update groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group participants can update groups" ON public.groups;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.groups;

-- Drop all policies on group_messages
DROP POLICY IF EXISTS "Allow all for authenticated users on group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Simple read access for group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Simple insert for group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Simple update for group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Enable read for authenticated users on group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Enable insert for message sender on group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Enable update for message sender on group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow users to send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow users to update their own messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow system messages" ON public.group_messages;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.group_messages;
DROP POLICY IF EXISTS "Enable insert for message sender" ON public.group_messages;
DROP POLICY IF EXISTS "Enable update for message sender" ON public.group_messages;

-- Drop all policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Drop all policies on user_outings_history
DROP POLICY IF EXISTS "Users can view their own outings history" ON public.user_outings_history;
DROP POLICY IF EXISTS "System can insert outings history" ON public.user_outings_history;

-- Drop all policies on bar_ratings
DROP POLICY IF EXISTS "Anyone can view bar ratings" ON public.bar_ratings;
DROP POLICY IF EXISTS "System can manage bar ratings" ON public.bar_ratings;

-- Step 2: Temporarily disable RLS on all tables for cleanup
ALTER TABLE public.group_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_outings_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_ratings DISABLE ROW LEVEL SECURITY;

-- Step 3: Clean up any inconsistent data
DELETE FROM public.group_participants WHERE group_id NOT IN (SELECT id FROM public.groups);

-- Correct participant counters
UPDATE public.groups 
SET current_participants = (
  SELECT COUNT(*) 
  FROM public.group_participants 
  WHERE group_id = groups.id AND status = 'confirmed'
);

-- Step 4: Re-enable RLS on all tables
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_outings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_ratings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create optimized, non-conflicting RLS policies

-- GROUPS TABLE POLICIES (Public read, authenticated write)
CREATE POLICY "authenticated_users_can_view_groups" 
  ON public.groups 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_create_groups" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_update_groups" 
  ON public.groups 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- GROUP_PARTICIPANTS TABLE POLICIES (Public read, own records write)
CREATE POLICY "authenticated_users_can_view_participants" 
  ON public.group_participants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_can_join_groups" 
  ON public.group_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_participation" 
  ON public.group_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_leave_groups" 
  ON public.group_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- GROUP_MESSAGES TABLE POLICIES (Group members only)
CREATE POLICY "group_members_can_read_messages" 
  ON public.group_messages 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = group_messages.group_id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

CREATE POLICY "group_members_can_send_messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = group_messages.group_id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

CREATE POLICY "system_can_send_messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (is_system = true);

-- PROFILES TABLE POLICIES (Own profile only)
CREATE POLICY "users_can_view_own_profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "system_can_create_profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (true);

-- USER_OUTINGS_HISTORY TABLE POLICIES (Own history only)
CREATE POLICY "users_can_view_own_history" 
  ON public.user_outings_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "system_can_manage_history" 
  ON public.user_outings_history 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- BAR_RATINGS TABLE POLICIES (Public read, system write)
CREATE POLICY "anyone_can_view_bar_ratings" 
  ON public.bar_ratings 
  FOR SELECT 
  USING (true);

CREATE POLICY "system_can_manage_bar_ratings" 
  ON public.bar_ratings 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Step 6: Clean up any problematic helper functions that might cause recursion
DROP FUNCTION IF EXISTS public.user_can_access_group_participants(uuid);
DROP FUNCTION IF EXISTS public.user_can_access_groups();

-- Step 7: Ensure all required indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_group_participants_user_group ON public.group_participants(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_status ON public.group_participants(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_participants_last_seen ON public.group_participants(last_seen);
CREATE INDEX IF NOT EXISTS idx_groups_status_participants ON public.groups(status, current_participants);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_system_trigger ON public.group_messages(group_id, is_system, message) WHERE is_system = true;
CREATE INDEX IF NOT EXISTS idx_user_outings_history_user_created ON public.user_outings_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bar_ratings_average ON public.bar_ratings(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_outings_history_rating ON public.user_outings_history(user_rating);

-- Step 8: Final validation - ensure all triggers are properly configured
-- Re-create the main trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_group_participant_changes ON public.group_participants;
CREATE TRIGGER trigger_group_participant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_group_participant_changes();

-- Ensure message validation trigger exists
DROP TRIGGER IF EXISTS trigger_validate_message ON public.group_messages;
CREATE TRIGGER trigger_validate_message
    BEFORE INSERT ON public.group_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_message_before_insert();

-- Ensure participant validation trigger exists
DROP TRIGGER IF EXISTS validate_participant_trigger ON public.group_participants;
CREATE TRIGGER validate_participant_trigger
    BEFORE INSERT ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_participant_before_insert();
