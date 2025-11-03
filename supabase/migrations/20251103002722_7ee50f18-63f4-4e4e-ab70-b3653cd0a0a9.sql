-- ===================================================================
-- CORRECTION CRITIQUE: Synchronisation current_participants
-- Date: 2025-11-03
-- Problème: Les groupes restent à current_participants=0 après création
-- Solution: Trigger automatique + initialisation correcte à 1
-- ===================================================================

-- 1. Supprimer l'ancien trigger/fonction s'ils existent (idempotent)
DROP TRIGGER IF EXISTS handle_group_participant_changes_ppu ON group_participants;
DROP FUNCTION IF EXISTS update_group_participant_count();

-- 2. Créer la fonction trigger SOTA 2025
CREATE OR REPLACE FUNCTION update_group_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    confirmed_count INT;
BEGIN
    -- Compter les participants confirmés pour ce groupe
    SELECT COUNT(*) INTO confirmed_count
    FROM group_participants
    WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
      AND status = 'confirmed';

    -- Mettre à jour le compteur du groupe
    UPDATE groups
    SET 
        current_participants = confirmed_count,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);

    RAISE NOTICE '✅ Trigger: Group % updated to % participants', 
        COALESCE(NEW.group_id, OLD.group_id), confirmed_count;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Créer le trigger pour INSERT, UPDATE, DELETE
CREATE TRIGGER handle_group_participant_changes_ppu
    AFTER INSERT OR UPDATE OR DELETE ON group_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_group_participant_count();

-- 4. Réparer les groupes existants avec compteurs incorrects
UPDATE groups g
SET current_participants = (
    SELECT COUNT(*)
    FROM group_participants gp
    WHERE gp.group_id = g.id
      AND gp.status = 'confirmed'
)
WHERE g.status IN ('waiting', 'confirmed');

-- 5. Corriger la fonction create_group_with_participant pour initialiser à 1
CREATE OR REPLACE FUNCTION create_group_with_participant(
    p_latitude double precision,
    p_longitude double precision,
    p_location_name text,
    p_user_id uuid
)
RETURNS TABLE(
    id uuid,
    status text,
    max_participants integer,
    current_participants integer,
    latitude double precision,
    longitude double precision,
    location_name text,
    search_radius integer,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_group_id uuid;
  validation_result boolean;
  sanitized_result RECORD;
BEGIN
  -- Sanitize coordinates
  SELECT * INTO sanitized_result FROM sanitize_coordinates_pg(p_latitude, p_longitude);
  p_latitude := sanitized_result.sanitized_lat;
  p_longitude := sanitized_result.sanitized_lng;
  
  -- Validate
  SELECT validate_coordinates_strict(p_latitude, p_longitude) INTO validation_result;
  
  IF NOT validation_result THEN
    RAISE EXCEPTION 'Invalid coordinates: lat=%, lng=%', p_latitude, p_longitude;
  END IF;

  -- Check participation limit
  IF NOT check_user_participation_limit(p_user_id) THEN
    RAISE EXCEPTION 'User is already in an active group';
  END IF;

  -- Transaction atomique
  BEGIN
    -- 1. Créer le groupe avec current_participants = 1 (fix critique)
    INSERT INTO groups (
      status,
      max_participants,
      current_participants,
      latitude,
      longitude,
      location_name,
      search_radius,
      created_by_user_id
    ) VALUES (
      'waiting',
      5,
      1,  -- ✅ FIX: Initialiser à 1 car on va insérer le créateur
      p_latitude,
      p_longitude,
      p_location_name,
      10000,
      p_user_id
    ) RETURNING groups.id INTO new_group_id;

    RAISE NOTICE '✅ Group created with id=%, current_participants initialized to 1', new_group_id;

    -- 2. Ajouter le créateur
    INSERT INTO group_participants (
      group_id,
      user_id,
      status,
      last_seen,
      latitude,
      longitude,
      location_name
    ) VALUES (
      new_group_id,
      p_user_id,
      'confirmed',
      NOW(),
      p_latitude,
      p_longitude,
      p_location_name
    );

    -- 3. Retourner les données
    RETURN QUERY
    SELECT 
      g.id,
      g.status,
      g.max_participants,
      g.current_participants,
      g.latitude,
      g.longitude,
      g.location_name,
      g.search_radius,
      g.created_at
    FROM groups g
    WHERE g.id = new_group_id;

  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error during atomic group creation: %', SQLERRM;
  END;
END;
$$;

-- 6. Créer une vue pour monitoring des désynchronisations
CREATE OR REPLACE VIEW group_sync_health AS
SELECT 
    g.id,
    g.status,
    g.current_participants as reported_count,
    COUNT(gp.id) as actual_count,
    (g.current_participants - COUNT(gp.id)) as drift
FROM groups g
LEFT JOIN group_participants gp ON gp.group_id = g.id AND gp.status = 'confirmed'
WHERE g.status IN ('waiting', 'confirmed')
GROUP BY g.id
HAVING g.current_participants != COUNT(gp.id);

-- Afficher les groupes réparés
SELECT 
    id,
    status,
    current_participants,
    created_at
FROM groups
WHERE status IN ('waiting', 'confirmed')
ORDER BY created_at DESC
LIMIT 10;