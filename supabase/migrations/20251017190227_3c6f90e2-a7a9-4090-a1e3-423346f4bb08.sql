-- Supprimer le trigger en double (ancien)
DROP TRIGGER IF EXISTS tg_group_participant_changes ON public.group_participants;

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.handle_group_participant_changes();

-- On garde uniquement group_participant_changes_trigger qui gère le PPU mode