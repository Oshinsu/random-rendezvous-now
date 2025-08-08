-- 1) Tighten groups SELECT policy and remove redundant ones
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'groups' AND policyname = 'Tous les utilisateurs peuvent voir les groupes') THEN
    DROP POLICY "Tous les utilisateurs peuvent voir les groupes" ON public.groups;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'groups' AND policyname = 'Authenticated users can view nearby groups') THEN
    DROP POLICY "Authenticated users can view nearby groups" ON public.groups;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'groups' AND policyname = 'authenticated_users_can_view_groups_v2') THEN
    DROP POLICY "authenticated_users_can_view_groups_v2" ON public.groups;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'groups' AND policyname = 'authenticated_users_can_view_active_groups') THEN
    CREATE POLICY "authenticated_users_can_view_active_groups" ON public.groups
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL AND status IN ('waiting','confirmed'));
  END IF;
END $$;

-- 2) Attach essential triggers (drop-if-exists to avoid duplicates)
DROP TRIGGER IF EXISTS trg_set_completed_at ON public.groups;
CREATE TRIGGER trg_set_completed_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_completed_at();

DROP TRIGGER IF EXISTS trg_add_to_outings_history ON public.groups;
CREATE TRIGGER trg_add_to_outings_history
AFTER UPDATE ON public.groups
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.completed_at IS DISTINCT FROM NEW.completed_at)
EXECUTE FUNCTION public.add_to_outings_history();

DROP TRIGGER IF EXISTS trg_validate_message_before_insert ON public.group_messages;
CREATE TRIGGER trg_validate_message_before_insert
BEFORE INSERT ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_before_insert();

-- 3) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_participants_group_id_status
  ON public.group_participants (group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id
  ON public.group_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_last_seen
  ON public.group_participants (last_seen);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id_created_at_desc
  ON public.group_messages (group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_groups_status_created_at
  ON public.groups (status, created_at);
CREATE INDEX IF NOT EXISTS idx_groups_is_scheduled_scheduled_for
  ON public.groups (is_scheduled, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_groups_completed_at
  ON public.groups (completed_at);

CREATE INDEX IF NOT EXISTS idx_user_outings_history_user_id_created_at
  ON public.user_outings_history (user_id, created_at);