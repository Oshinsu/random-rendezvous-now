-- Drop the problematic auto-cleanup trigger on groups to prevent timeouts during inserts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'tg_auto_cleanup_on_group_operations'
      AND n.nspname = 'public'
      AND c.relname = 'groups'
  ) THEN
    EXECUTE 'DROP TRIGGER tg_auto_cleanup_on_group_operations ON public.groups';
    RAISE NOTICE 'Dropped trigger tg_auto_cleanup_on_group_operations on public.groups';
  ELSE
    RAISE NOTICE 'Trigger tg_auto_cleanup_on_group_operations not found on public.groups';
  END IF;
END $$;