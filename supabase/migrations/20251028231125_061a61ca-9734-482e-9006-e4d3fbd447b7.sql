-- Fix security issue: Restrict access to crm_cohort_analysis materialized view
-- This view should only be accessible to admins, not to anon or authenticated roles

-- Revoke public access
REVOKE ALL ON crm_cohort_analysis FROM anon, authenticated;

-- Grant access only to service_role
GRANT SELECT ON crm_cohort_analysis TO service_role;

-- Update refresh function to use security definer with proper search path
CREATE OR REPLACE FUNCTION refresh_crm_cohort_analysis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW crm_cohort_analysis;
END;
$$;