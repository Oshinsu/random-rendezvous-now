-- ============================================================================
-- FIX: Service Role Access for Edge Functions with JOINs
-- Source: Supabase RLS Best Practices 2025
-- Issue: Edge functions using service_role key cannot perform JOINs on tables
--        without explicit service_role policies due to RLS row visibility rules
-- ============================================================================

-- Policy pour profiles (CRITIQUE pour JOINs dans edge functions)
CREATE POLICY "Service role has full access to profiles" 
  ON "public"."profiles"
  AS PERMISSIVE 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Policy pour crm_user_segment_memberships (sécurité défensive)
CREATE POLICY "Service role has full access to segment memberships" 
  ON "public"."crm_user_segment_memberships"
  AS PERMISSIVE 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Commentaires pour documentation
COMMENT ON POLICY "Service role has full access to profiles" ON "public"."profiles" 
IS 'Required for edge functions to perform JOINs with service_role key. PostgREST requires explicit row visibility for all tables in JOIN operations, even with service_role. Source: Supabase RLS Troubleshooting Guide Oct 2025';

COMMENT ON POLICY "Service role has full access to segment memberships" ON "public"."crm_user_segment_memberships" 
IS 'Defensive policy to ensure edge functions can query segment memberships without RLS blocking. Required for send-lifecycle-campaign function. Source: PostgREST v12.2 Resource Embedding Guide';