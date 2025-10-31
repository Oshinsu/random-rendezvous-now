-- ============================================================================
-- PHASE 3: FIX SEGMENT "HORAIRES INADAPTÉS" (SOTA Oct 2025)
-- Reduce off_peak_ratio_min from 70% to 50% to capture more users
-- Source: Behavioral Segmentation Best Practices 2025
-- ============================================================================

UPDATE crm_user_segments
SET 
  criteria = jsonb_set(
    criteria, 
    '{off_peak_ratio_min}', 
    '50'::jsonb
  ),
  description = 'Utilisateurs qui se connectent principalement hors des heures de pointe (>50% des connexions entre 22h-18h). Cible: campagnes de sensibilisation aux horaires optimaux.',
  updated_at = NOW()
WHERE segment_key = 'off_peak_users';

-- Verify the change
DO $$
DECLARE
  updated_criteria jsonb;
BEGIN
  SELECT criteria INTO updated_criteria
  FROM crm_user_segments
  WHERE segment_key = 'off_peak_users';
  
  RAISE NOTICE '✅ Phase 3 Complete: off_peak_users segment criteria updated to 50%% threshold';
  RAISE NOTICE 'New criteria: %', updated_criteria;
END $$;