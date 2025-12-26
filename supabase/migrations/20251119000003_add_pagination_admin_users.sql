-- Migration: Ajouter pagination pour AdminUsers
-- Date: 2025-11-19
-- Description: Créer une fonction RPC paginée pour éviter de charger tous les utilisateurs

-- ============================================================================
-- FONCTION: get_all_users_admin_paginated
-- ============================================================================
-- Remplace get_all_users_admin pour ajouter la pagination côté serveur
-- Retourne les utilisateurs avec leurs stats + le total pour la pagination

CREATE OR REPLACE FUNCTION get_all_users_admin_paginated(
  page_num INT DEFAULT 1,
  page_size INT DEFAULT 50,
  search_query TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  active_groups_count BIGINT,
  total_outings_count BIGINT,
  total_count BIGINT -- Pour afficher "Page 1 sur 19"
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users BIGINT;
  offset_val INT;
BEGIN
  -- Calculer l'offset
  offset_val := (page_num - 1) * page_size;
  
  -- Compter le total d'utilisateurs (avec filtre de recherche si applicable)
  IF search_query IS NOT NULL AND search_query != '' THEN
    SELECT COUNT(*)
    INTO total_users
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE 
      u.email ILIKE '%' || search_query || '%'
      OR p.first_name ILIKE '%' || search_query || '%'
      OR p.last_name ILIKE '%' || search_query || '%';
  ELSE
    SELECT COUNT(*) INTO total_users FROM auth.users;
  END IF;
  
  -- Retourner les utilisateurs paginés avec leurs stats
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    p.first_name,
    p.last_name,
    COUNT(DISTINCT gp.group_id) FILTER (
      WHERE g.status IN ('waiting', 'confirmed')
    ) as active_groups_count,
    COUNT(DISTINCT CASE 
      WHEN g.status = 'completed' THEN g.id 
    END) as total_outings_count,
    total_users as total_count
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  LEFT JOIN group_participants gp ON gp.user_id = u.id AND gp.status = 'active'
  LEFT JOIN groups g ON g.id = gp.group_id
  WHERE 
    (search_query IS NULL OR search_query = '' OR
     u.email ILIKE '%' || search_query || '%' OR
     p.first_name ILIKE '%' || search_query || '%' OR
     p.last_name ILIKE '%' || search_query || '%')
  GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at, p.first_name, p.last_name
  ORDER BY 
    CASE 
      WHEN sort_by = 'created_at' AND sort_order = 'DESC' THEN u.created_at
    END DESC,
    CASE 
      WHEN sort_by = 'created_at' AND sort_order = 'ASC' THEN u.created_at
    END ASC,
    CASE 
      WHEN sort_by = 'email' AND sort_order = 'DESC' THEN u.email
    END DESC,
    CASE 
      WHEN sort_by = 'email' AND sort_order = 'ASC' THEN u.email
    END ASC,
    CASE 
      WHEN sort_by = 'last_sign_in_at' AND sort_order = 'DESC' THEN u.last_sign_in_at
    END DESC,
    CASE 
      WHEN sort_by = 'last_sign_in_at' AND sort_order = 'ASC' THEN u.last_sign_in_at
    END ASC
  LIMIT page_size
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON FUNCTION get_all_users_admin_paginated IS 
'Récupère les utilisateurs avec pagination côté serveur.
Paramètres:
- page_num: Numéro de page (1-based)
- page_size: Nombre d''utilisateurs par page (défaut: 50)
- search_query: Recherche dans email, first_name, last_name
- sort_by: Colonne de tri (created_at, email, last_sign_in_at)
- sort_order: Ordre de tri (ASC, DESC)

Retourne:
- Utilisateurs avec leurs stats (groupes actifs, sorties)
- total_count: Total d''utilisateurs (pour calculer le nombre de pages)

Exemple:
SELECT * FROM get_all_users_admin_paginated(1, 50, ''john'', ''created_at'', ''DESC'');
';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Seuls les admins peuvent exécuter cette fonction
REVOKE ALL ON FUNCTION get_all_users_admin_paginated FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_all_users_admin_paginated TO authenticated;

-- ============================================================================
-- TESTS
-- ============================================================================
-- Test 1: Récupérer la première page (50 utilisateurs)
-- SELECT * FROM get_all_users_admin_paginated(1, 50);

-- Test 2: Recherche par email
-- SELECT * FROM get_all_users_admin_paginated(1, 50, 'test@example.com');

-- Test 3: Tri par dernière connexion
-- SELECT * FROM get_all_users_admin_paginated(1, 50, NULL, 'last_sign_in_at', 'DESC');

-- Test 4: Vérifier le total_count
-- SELECT DISTINCT total_count FROM get_all_users_admin_paginated(1, 50);


