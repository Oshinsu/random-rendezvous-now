
-- Fonction pour créer un groupe et ajouter le participant dans une transaction atomique
CREATE OR REPLACE FUNCTION create_group_with_participant(
  p_latitude double precision,
  p_longitude double precision,
  p_location_name text,
  p_user_id uuid
) RETURNS TABLE(
  id uuid,
  status text,
  max_participants integer,
  current_participants integer,
  latitude double precision,
  longitude double precision,
  location_name text,
  search_radius integer,
  created_at timestamp with time zone
) AS $$
DECLARE
  new_group_id uuid;
BEGIN
  -- Commencer la transaction atomique
  BEGIN
    -- 1. Créer le groupe
    INSERT INTO public.groups (
      status,
      max_participants,
      current_participants,
      latitude,
      longitude,
      location_name,
      search_radius
    ) VALUES (
      'waiting',
      5,
      1, -- Déjà 1 participant (celui qui crée)
      p_latitude,
      p_longitude,
      p_location_name,
      10000
    ) RETURNING public.groups.id INTO new_group_id;

    -- 2. Ajouter immédiatement le participant créateur
    INSERT INTO public.group_participants (
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

    -- 3. Retourner les données du groupe créé
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
    FROM public.groups g
    WHERE g.id = new_group_id;

  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur, la transaction sera automatiquement annulée
    RAISE EXCEPTION 'Erreur lors de la crétion atomique du groupe: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
