-- Désactiver REPLICA IDENTITY FULL pour réduire la charge Realtime
-- et éviter les boucles infinies de synchronisation

-- Revenir à REPLICA IDENTITY DEFAULT pour les tables principales
ALTER TABLE public.groups REPLICA IDENTITY DEFAULT;
ALTER TABLE public.group_participants REPLICA IDENTITY DEFAULT;
ALTER TABLE public.group_messages REPLICA IDENTITY DEFAULT;

-- Migration terminée : REPLICA IDENTITY DEFAULT activé pour groups, group_participants, group_messages
-- Cela réduit le payload Realtime et prévient les boucles de synchronisation infinies