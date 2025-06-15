
-- Supprimer complètement toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Allow all for authenticated users on group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Allow all for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Allow all for authenticated users on group_messages" ON public.group_messages;

-- Désactiver temporairement RLS pour débugger
ALTER TABLE public.group_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages DISABLE ROW LEVEL SECURITY;

-- Supprimer le trigger de validation qui peut causer des problèmes
DROP TRIGGER IF EXISTS validate_participant_trigger ON public.group_participants;

-- Nettoyer les données incohérentes
DELETE FROM public.group_participants WHERE group_id NOT IN (SELECT id FROM public.groups);

-- Corriger les compteurs de participants
UPDATE public.groups 
SET current_participants = (
  SELECT COUNT(*) 
  FROM public.group_participants 
  WHERE group_id = groups.id AND status = 'confirmed'
);
