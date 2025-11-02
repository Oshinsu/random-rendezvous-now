-- Phase 2: Réparer les données corrompues dans groups.current_participants
-- Problème: Certains groupes ont current_participants != COUNT(*) réel
-- Cause: Double/triple incrémentation via updates optimistes + trigger PostgreSQL
-- Solution: Recalculer current_participants depuis group_participants pour tous les groupes

-- Étape 1: Réparer tous les groupes avec compteur incorrect
UPDATE public.groups g
SET 
  current_participants = (
    SELECT COUNT(*) 
    FROM public.group_participants gp 
    WHERE gp.group_id = g.id 
      AND gp.status = 'confirmed'
  ),
  updated_at = NOW()
WHERE g.current_participants != (
  SELECT COUNT(*) 
  FROM public.group_participants gp 
  WHERE gp.group_id = g.id 
    AND gp.status = 'confirmed'
);

-- Étape 2: Vérification post-réparation (logs uniquement, pas de modifications)
DO $$
DECLARE
  mismatch_count INTEGER;
  repair_count INTEGER;
BEGIN
  -- Compter les groupes réparés
  GET DIAGNOSTICS repair_count = ROW_COUNT;
  
  -- Compter les groupes encore en désaccord (devrait être 0)
  SELECT COUNT(*) INTO mismatch_count
  FROM public.groups g
  WHERE g.current_participants != (
    SELECT COUNT(*) 
    FROM public.group_participants gp 
    WHERE gp.group_id = g.id 
      AND gp.status = 'confirmed'
  );
  
  RAISE NOTICE '✅ Phase 2 terminée: % groupes réparés, % restants en désaccord', 
    repair_count, mismatch_count;
    
  IF mismatch_count > 0 THEN
    RAISE WARNING '⚠️  Certains groupes ont encore un compteur incorrect, vérifier manuellement';
  END IF;
END $$;