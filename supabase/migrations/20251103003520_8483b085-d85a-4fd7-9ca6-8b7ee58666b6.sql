-- ===================================================================
-- CORRECTION CRITIQUE: Nettoyage Triggers + RLS + pg_net
-- Date: 2025-11-03
-- Problème: 11 triggers conflictuels + RLS violations + pg_net manquant
-- ===================================================================

-- 1. Activer pg_net pour les webhooks
CREATE EXTENSION IF NOT EXISTS pg_net CASCADE;

-- 2. Supprimer les triggers redondants (garder uniquement handle_group_participant_changes_ppu)
DROP TRIGGER IF EXISTS group_participant_changes_trigger ON group_participants;
DROP TRIGGER IF EXISTS trigger_update_participant_count_insert ON group_participants;
DROP TRIGGER IF EXISTS trigger_update_participant_count_delete ON group_participants;

-- 3. Supprimer les anciennes fonctions orphelines
DROP FUNCTION IF EXISTS update_participant_count_on_insert();
DROP FUNCTION IF EXISTS update_participant_count_on_delete();
DROP FUNCTION IF EXISTS handle_participant_count_change();

-- 4. Fonction helper pour bypass RLS de manière sécurisée (SOTA Oct 2025)
CREATE OR REPLACE FUNCTION add_participant_as_service(
    p_group_id UUID,
    p_user_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_location_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_participant_id UUID;
BEGIN
    -- Vérifier que le groupe existe
    IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id) THEN
        RAISE EXCEPTION 'Group not found: %', p_group_id;
    END IF;
    
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    -- Insérer avec SECURITY DEFINER (bypass RLS)
    INSERT INTO group_participants (
        group_id,
        user_id,
        status,
        latitude,
        longitude,
        location_name
    ) VALUES (
        p_group_id,
        p_user_id,
        'confirmed',
        p_latitude,
        p_longitude,
        p_location_name
    )
    RETURNING id INTO new_participant_id;
    
    RAISE NOTICE '✅ Participant added via SECURITY DEFINER: user=%, group=%', p_user_id, p_group_id;
    
    RETURN new_participant_id;
END;
$$;

-- Grant aux edge functions (via service_role)
GRANT EXECUTE ON FUNCTION add_participant_as_service TO service_role;

-- 5. Réparer les groupes existants avec compteurs désynchronisés
UPDATE groups g
SET current_participants = (
    SELECT COUNT(*)
    FROM group_participants gp
    WHERE gp.group_id = g.id
      AND gp.status = 'confirmed'
)
WHERE g.status IN ('waiting', 'confirmed');

-- 6. Afficher les résultats de réparation
SELECT 
    id,
    status,
    current_participants,
    created_at
FROM groups
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC
LIMIT 10;