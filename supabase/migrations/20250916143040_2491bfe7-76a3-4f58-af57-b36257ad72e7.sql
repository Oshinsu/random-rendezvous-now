-- NETTOYAGE COMPLET ET MÉTHODIQUE DES TRIGGERS
-- Étape 1: Supprimer TOUS les triggers existants de manière exhaustive

-- Triggers sur groups
DROP TRIGGER IF EXISTS add_to_outings_history ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trg_add_to_outings_history ON public.groups CASCADE;
DROP TRIGGER IF EXISTS groups_add_to_outings_history_trigger ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trigger_add_to_outings_history ON public.groups CASCADE;
DROP TRIGGER IF EXISTS set_completed_at ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trg_set_completed_at ON public.groups CASCADE;
DROP TRIGGER IF EXISTS groups_set_completed_at_trigger ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trigger_set_completed_at ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_bar_assignment ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trg_trigger_auto_bar_assignment ON public.groups CASCADE;
DROP TRIGGER IF EXISTS auto_cleanup_trigger ON public.groups CASCADE;
DROP TRIGGER IF EXISTS trg_auto_cleanup ON public.groups CASCADE;

-- Triggers sur group_participants
DROP TRIGGER IF EXISTS handle_group_participant_changes ON public.group_participants CASCADE;
DROP TRIGGER IF EXISTS trg_handle_group_participant_changes ON public.group_participants CASCADE;
DROP TRIGGER IF EXISTS group_participants_changes_trigger ON public.group_participants CASCADE;

-- Triggers sur group_messages
DROP TRIGGER IF EXISTS validate_message_before_insert ON public.group_messages CASCADE;
DROP TRIGGER IF EXISTS trg_validate_message_before_insert ON public.group_messages CASCADE;
DROP TRIGGER IF EXISTS update_participant_last_seen ON public.group_messages CASCADE;
DROP TRIGGER IF EXISTS trg_update_participant_last_seen ON public.group_messages CASCADE;

-- Triggers sur group_participants (validation)
DROP TRIGGER IF EXISTS validate_participant_before_insert ON public.group_participants CASCADE;
DROP TRIGGER IF EXISTS trg_validate_participant_before_insert ON public.group_participants CASCADE;

-- Triggers sur user_outings_history
DROP TRIGGER IF EXISTS update_bar_rating ON public.user_outings_history CASCADE;
DROP TRIGGER IF EXISTS trg_update_bar_rating ON public.user_outings_history CASCADE;

-- Triggers sur auth.users
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users CASCADE;