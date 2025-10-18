-- Vérifier que la fonction existe (elle devrait exister)
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'trigger_auto_bar_assignment';

-- Recréer le trigger qui manque sur la table groups
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- Vérifier que le trigger est bien créé
-- SELECT trigger_name FROM information_schema.triggers 
-- WHERE event_object_table = 'groups' 
-- AND trigger_name = 'tg_trigger_auto_bar_assignment';