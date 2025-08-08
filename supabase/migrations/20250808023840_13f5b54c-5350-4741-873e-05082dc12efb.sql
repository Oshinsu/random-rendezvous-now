-- Performance and data integrity improvements
-- 1) Ensure ON CONFLICT works for bar_ratings by enforcing uniqueness on bar_place_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_bar_ratings_place ON public.bar_ratings (bar_place_id);

-- 2) Speed up Outings History queries (per-user ordered by date)
CREATE INDEX IF NOT EXISTS idx_uoh_user_completed ON public.user_outings_history (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_uoh_group ON public.user_outings_history (group_id);

-- 3) Optimize group participants lookups and counters
CREATE INDEX IF NOT EXISTS idx_gp_group_confirmed ON public.group_participants (group_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_gp_user_confirmed ON public.group_participants (user_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_gp_last_seen ON public.group_participants (last_seen);
CREATE INDEX IF NOT EXISTS idx_gp_group_user ON public.group_participants (group_id, user_id);

-- 4) Optimize groups maintenance and scheduled activation
--    a) Find empty waiting groups older than threshold
CREATE INDEX IF NOT EXISTS idx_groups_status_participants_created ON public.groups (status, current_participants, created_at);
--    b) Activate scheduled groups when due
CREATE INDEX IF NOT EXISTS idx_groups_scheduled_time_status ON public.groups (is_scheduled, scheduled_for, status);
--    c) Transition confirmed groups to completed when meeting_time passed and bar assigned
CREATE INDEX IF NOT EXISTS idx_groups_confirmed_meeting_time ON public.groups (meeting_time) WHERE status = 'confirmed' AND bar_name IS NOT NULL;
--    d) Cleanup very old completed groups
CREATE INDEX IF NOT EXISTS idx_groups_completed_at ON public.groups (completed_at) WHERE status = 'completed';

-- 5) Optimize trigger de-duplication lookups on group_messages
CREATE INDEX IF NOT EXISTS idx_gm_trigger_recent ON public.group_messages (group_id, created_at DESC)
  WHERE is_system = true AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER';
-- Generic lookup by group
CREATE INDEX IF NOT EXISTS idx_gm_group_created_at ON public.group_messages (group_id, created_at);
