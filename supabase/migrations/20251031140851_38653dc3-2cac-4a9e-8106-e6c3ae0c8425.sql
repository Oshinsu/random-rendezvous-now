-- Phase 1: Fix RLS policies for crm_campaigns table

-- Drop existing generic policy
DROP POLICY IF EXISTS "Admins can manage campaigns" ON crm_campaigns;

-- Create explicit policies per operation
CREATE POLICY "Admins can insert campaigns" ON crm_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update campaigns" ON crm_campaigns
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete campaigns" ON crm_campaigns
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can view campaigns" ON crm_campaigns
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Add policy for Service Role (edge functions)
CREATE POLICY "Service role can manage campaigns" ON crm_campaigns
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);