-- 1) Deduplicate and enforce uniqueness on user_outings_history (user_id, group_id)
DO $$
BEGIN
  -- Remove duplicates keeping the most recent entry per (user_id, group_id)
  DELETE FROM public.user_outings_history u
  USING (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, group_id ORDER BY created_at DESC) AS rn
    FROM public.user_outings_history
  ) d
  WHERE u.id = d.id AND d.rn > 1;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Deduplication on user_outings_history failed: %', SQLERRM;
END $$;

-- Add unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_outings_history_user_group
  ON public.user_outings_history (user_id, group_id);


-- 2) Deduplicate confirmed participations and enforce uniqueness on group_participants (group_id, user_id) when status='confirmed'
DO $$
BEGIN
  -- Remove duplicates among confirmed participations, keeping the most recent joined_at
  DELETE FROM public.group_participants gp
  USING (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY group_id, user_id, status
      ORDER BY joined_at DESC
    ) AS rn
    FROM public.group_participants
    WHERE status = 'confirmed'
  ) d
  WHERE gp.id = d.id AND d.rn > 1;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Deduplication on group_participants failed: %', SQLERRM;
END $$;

-- Partial unique index to ensure a user can only be confirmed once per group
CREATE UNIQUE INDEX IF NOT EXISTS ux_group_participants_confirmed_unique
  ON public.group_participants (group_id, user_id)
  WHERE status = 'confirmed';


-- 3) Performance indexes for common queries
-- Faster chat message retrieval per group ordered by time
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON public.group_messages (group_id, created_at DESC);

-- Speed up group status filtering and recency checks
CREATE INDEX IF NOT EXISTS idx_groups_status_created
  ON public.groups (status, created_at DESC);

-- Optimize lookups for scheduled group activation
CREATE INDEX IF NOT EXISTS idx_groups_scheduled
  ON public.groups (is_scheduled, scheduled_for);

-- Faster participant listings by group
CREATE INDEX IF NOT EXISTS idx_group_participants_group
  ON public.group_participants (group_id);
