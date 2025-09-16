-- RECRÉATION DES TRIGGERS OPTIMAUX (UN SEUL DE CHAQUE TYPE)

-- 1. TRIGGER OPTIMAL: Gestion du completed_at (BEFORE UPDATE)
CREATE TRIGGER trg_set_completed_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_completed_at();

-- 2. TRIGGER OPTIMAL: Ajout à l'historique des sorties (AFTER UPDATE)
CREATE TRIGGER trg_add_to_outings_history
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.add_to_outings_history();

-- 3. TRIGGER OPTIMAL: Auto-assignation de bar (AFTER UPDATE)
CREATE TRIGGER trg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- 4. TRIGGER OPTIMAL: Gestion des changements de participants (AFTER INSERT/UPDATE/DELETE)
CREATE TRIGGER trg_handle_group_participant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_group_participant_changes();

-- 5. TRIGGER OPTIMAL: Validation des messages (BEFORE INSERT)
CREATE TRIGGER trg_validate_message_before_insert
    BEFORE INSERT ON public.group_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_message_before_insert();

-- 6. TRIGGER OPTIMAL: Validation des participants (BEFORE INSERT)
CREATE TRIGGER trg_validate_participant_before_insert
    BEFORE INSERT ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_participant_before_insert();

-- 7. TRIGGER OPTIMAL: Mise à jour des ratings de bar (AFTER UPDATE)
CREATE TRIGGER trg_update_bar_rating
    AFTER UPDATE ON public.user_outings_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bar_rating();

-- 8. TRIGGER OPTIMAL: Gestion des nouveaux utilisateurs (AFTER INSERT)
CREATE TRIGGER trg_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();