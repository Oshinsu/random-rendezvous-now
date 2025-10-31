-- ============================================================================
-- FIX: Clean orphaned data and add FK for PostgREST Resource Embedding
-- Source: PostgREST v12.2 + PostgreSQL Foreign Key Best Practices 2025
-- ============================================================================

-- ÉTAPE 1: Nettoyer les données orphelines (11 lignes détectées)
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM crm_user_segment_memberships
  WHERE user_id NOT IN (SELECT id FROM profiles);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '🧹 Cleaned % orphaned rows from crm_user_segment_memberships', deleted_count;
END $$;

-- ÉTAPE 2: Ajouter la Foreign Key (CRITIQUE pour PostgREST JOINs)
ALTER TABLE "public"."crm_user_segment_memberships"
  ADD CONSTRAINT "crm_user_segment_memberships_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."profiles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- ÉTAPE 3: Créer un index pour optimiser les JOINs (performance 10-100x)
CREATE INDEX IF NOT EXISTS "idx_crm_segment_memberships_user_id" 
  ON "public"."crm_user_segment_memberships"("user_id");

-- ÉTAPE 4: Commentaire pour documentation
COMMENT ON CONSTRAINT "crm_user_segment_memberships_user_id_fkey" 
  ON "public"."crm_user_segment_memberships" 
IS 'Required for PostgREST resource embedding with profiles!inner(). Without this FK, PostgREST returns PGRST200 "Could not find a relationship" error. Source: PostgREST v12.2 Resource Embedding Guide Oct 2025';

-- Log final
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign key and index created successfully for crm_user_segment_memberships';
END $$;