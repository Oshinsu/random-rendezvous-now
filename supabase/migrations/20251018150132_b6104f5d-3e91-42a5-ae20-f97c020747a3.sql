-- ================================================
-- Migration: Ajouter updated_at à la table groups
-- ================================================

-- 1. Ajouter la colonne updated_at à la table groups
ALTER TABLE public.groups 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- 2. Initialiser updated_at avec created_at pour les lignes existantes
UPDATE public.groups 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. Créer un trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Activer la réplication complète pour realtime (si pas déjà fait)
ALTER TABLE public.groups REPLICA IDENTITY FULL;

-- 5. Ajouter la table à la publication realtime (si pas déjà fait)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'groups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
    END IF;
END $$;

-- 6. Vérifier que group_messages est aussi dans realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'group_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
    END IF;
END $$;

-- 7. Créer un index pour optimiser les requêtes sur status + current_participants
CREATE INDEX IF NOT EXISTS idx_groups_status_participants 
ON public.groups(status, current_participants) 
WHERE status IN ('waiting', 'confirmed');

-- 8. Créer un index pour optimiser les recherches de groupes récents
CREATE INDEX IF NOT EXISTS idx_groups_created_at 
ON public.groups(created_at DESC) 
WHERE status = 'waiting';

COMMENT ON COLUMN public.groups.updated_at IS 'Timestamp automatiquement mis à jour lors de chaque modification du groupe';
