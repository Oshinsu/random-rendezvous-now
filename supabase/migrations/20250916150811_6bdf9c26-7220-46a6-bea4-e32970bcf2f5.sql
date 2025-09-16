-- OPTIMISATION DES INDEX DUPLIQUÉS
-- Suppression des index redondants et consolidation

-- ========================================
-- NETTOYAGE DES INDEX DUPLIQUÉS SUR group_messages
-- ========================================

-- Supprimer les doublons (garder les plus utiles)
DROP INDEX IF EXISTS public.idx_group_messages_group_created; -- doublon de idx_gm_group_created_at
DROP INDEX IF EXISTS public.idx_group_messages_group_id_created_at; -- doublon de idx_gm_group_created_at  
DROP INDEX IF EXISTS public.idx_group_messages_group_id_created_at_desc; -- doublon de idx_gm_group_created_at

-- Optimiser l'index des triggers système (plus spécifique)
DROP INDEX IF EXISTS public.idx_group_messages_system_trigger;
CREATE INDEX IF NOT EXISTS idx_gm_system_messages_optimized 
ON public.group_messages (group_id, created_at DESC, is_system) 
WHERE is_system = true;

-- ========================================  
-- NETTOYAGE DES INDEX DUPLIQUÉS SUR group_participants
-- ========================================

-- Supprimer les nombreux doublons
DROP INDEX IF EXISTS public.idx_gp_group_user; -- redondant avec UNIQUE constraint group_participants_group_id_user_id_key
DROP INDEX IF EXISTS public.idx_group_participants_group; -- doublon de idx_gp_group_confirmed (moins utile)
DROP INDEX IF EXISTS public.idx_group_participants_group_status; -- doublon de idx_group_participants_group_id_status
DROP INDEX IF EXISTS public.idx_group_participants_last_seen; -- doublon de idx_gp_last_seen
DROP INDEX IF EXISTS public.idx_group_participants_user_group; -- redondant avec autres index user
DROP INDEX IF EXISTS public.idx_group_participants_user_id; -- moins utile que les index avec status
DROP INDEX IF EXISTS public.idx_group_participants_user_status_optimized; -- doublon de idx_active_participants

-- Créer un index composite optimisé pour remplacer plusieurs index
CREATE INDEX IF NOT EXISTS idx_gp_comprehensive 
ON public.group_participants (group_id, status, user_id, last_seen);

-- Supprimer l'ancien index group_user_status maintenant couvert par le comprehensive
DROP INDEX IF EXISTS public.idx_group_participants_group_user_status;

-- ========================================
-- RÉSUMÉ DES INDEX FINAUX OPTIMISÉS
-- ========================================

-- group_messages (5 index au lieu de 8) :
-- 1. group_messages_pkey (PRIMARY KEY - nécessaire)
-- 2. idx_gm_group_created_at (group_id, created_at) - requêtes principales
-- 3. idx_gm_trigger_recent (triggers spécifiques) 
-- 4. idx_gm_system_messages_optimized (messages système optimisé)
-- 5. idx_messages_security_lookup (security lookup)

-- group_participants (8 index au lieu de 15) :
-- 1. group_participants_pkey (PRIMARY KEY - nécessaire)  
-- 2. group_participants_group_id_user_id_key (UNIQUE - nécessaire)
-- 3. idx_active_participants (user_id, status, group_id) WHERE confirmed
-- 4. idx_gp_group_confirmed (group_id) WHERE confirmed  
-- 5. idx_gp_last_seen (last_seen) - nettoyage participants inactifs
-- 6. idx_gp_user_confirmed (user_id) WHERE confirmed
-- 7. idx_group_participants_group_id_status (group_id, status) - comptage participants
-- 8. idx_gp_comprehensive (group_id, status, user_id, last_seen) - requêtes complexes
-- 9. idx_participants_location (latitude, longitude) - recherche géographique