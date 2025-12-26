-- ============================================
-- SCRIPT COMPLET DE DIAGNOSTIC ET CORRECTION
-- Random Rendezvous - Problème des participants
-- ============================================
-- À exécuter dans le SQL Editor de Supabase
-- Projet: xhrievvdnajvylyrowwu
-- Date: 19 Novembre 2025

-- ============================================
-- ÉTAPE 1: DIAGNOSTIC COMPLET
-- ============================================

-- 1.1 Analyser tous les groupes avec leurs participants réels
SELECT 
  '=== ANALYSE DES GROUPES ===' as section;

SELECT 
  g.id,
  g.status,
  g.created_at,
  g.current_participants as compteur_declare,
  COUNT(gp.id) as participants_reels,
  g.bar_name,
  g.is_test_group,
  g.is_scheduled,
  g.created_by_user_id,
  CASE 
    WHEN g.current_participants = COUNT(gp.id) THEN '✅ OK'
    ELSE '❌ INCOHÉRENCE'
  END as statut_coherence
FROM groups g
LEFT JOIN group_participants gp ON g.id = gp.group_id
GROUP BY g.id, g.status, g.created_at, g.current_participants, g.bar_name, g.is_test_group, g.is_scheduled, g.created_by_user_id
ORDER BY g.created_at DESC;

-- 1.2 Statistiques globales
SELECT 
  '=== STATISTIQUES GLOBALES ===' as section;

SELECT 
  COUNT(*) as total_groupes,
  COUNT(CASE WHEN is_test_group = true THEN 1 END) as groupes_test,
  COUNT(CASE WHEN current_participants = 0 THEN 1 END) as groupes_vides,
  COUNT(CASE WHEN current_participants > 0 THEN 1 END) as groupes_avec_participants,
  AVG(current_participants) as moyenne_participants,
  MAX(current_participants) as max_participants
FROM groups;

-- 1.3 Vérifier les participants
SELECT 
  '=== PARTICIPANTS EXISTANTS ===' as section;

SELECT 
  gp.id,
  gp.group_id,
  gp.user_id,
  gp.status,
  gp.joined_at,
  g.status as group_status,
  g.bar_name,
  p.first_name,
  p.email
FROM group_participants gp
JOIN groups g ON gp.group_id = g.id
LEFT JOIN profiles p ON gp.user_id = p.id
ORDER BY gp.joined_at DESC;

-- 1.4 Vérifier les triggers existants
SELECT 
  '=== TRIGGERS SUR GROUPS ET PARTICIPANTS ===' as section;

SELECT 
  trigger_name,
  event_manipulation as event,
  event_object_table as table_name,
  action_timing as timing,
  LEFT(action_statement, 100) as action_preview
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('groups', 'group_participants')
ORDER BY event_object_table, trigger_name;

-- 1.5 Vérifier les fonctions liées aux groupes
SELECT 
  '=== FONCTIONS POSTGRESQL POUR GROUPES ===' as section;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  CASE 
    WHEN array_to_string(proconfig, ',') LIKE '%search_path%' THEN '✅ search_path OK'
    ELSE '⚠️ search_path manquant'
  END as security_status
FROM information_schema.routines r
LEFT JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
AND (
  routine_name LIKE '%group%' 
  OR routine_name LIKE '%participant%'
)
ORDER BY routine_name;

-- ============================================
-- ÉTAPE 2: CORRECTIONS AUTOMATIQUES
-- ============================================

-- 2.1 Recalculer current_participants pour tous les groupes
SELECT 
  '=== RECALCUL DES COMPTEURS ===' as section;

UPDATE groups g
SET current_participants = (
  SELECT COUNT(*)
  FROM group_participants gp
  WHERE gp.group_id = g.id
  AND gp.status = 'confirmed'
);

-- Afficher le résultat
SELECT 
  COUNT(*) as groupes_mis_a_jour,
  SUM(current_participants) as total_participants
FROM groups;

-- 2.2 Créer ou remplacer la fonction de mise à jour automatique
SELECT 
  '=== CRÉATION FONCTION UPDATE PARTICIPANT COUNT ===' as section;

CREATE OR REPLACE FUNCTION update_group_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur lors de l'ajout d'un participant
    UPDATE groups
    SET 
      current_participants = current_participants + 1,
      updated_at = NOW()
    WHERE id = NEW.group_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur lors de la suppression d'un participant
    UPDATE groups
    SET 
      current_participants = GREATEST(0, current_participants - 1),
      updated_at = NOW()
    WHERE id = OLD.group_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si le statut change de 'pending' à 'confirmed'
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE groups
      SET 
        current_participants = current_participants + 1,
        updated_at = NOW()
      WHERE id = NEW.group_id;
    
    -- Si le statut change de 'confirmed' à autre chose
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE groups
      SET 
        current_participants = GREATEST(0, current_participants - 1),
        updated_at = NOW()
      WHERE id = OLD.group_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2.3 Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS increment_group_participant_count ON group_participants;
DROP TRIGGER IF EXISTS decrement_group_participant_count ON group_participants;
DROP TRIGGER IF EXISTS update_group_participant_count_on_status ON group_participants;

-- 2.4 Créer les nouveaux triggers
SELECT 
  '=== CRÉATION DES TRIGGERS ===' as section;

-- Trigger pour INSERT
CREATE TRIGGER increment_group_participant_count
AFTER INSERT ON group_participants
FOR EACH ROW
EXECUTE FUNCTION update_group_participant_count();

-- Trigger pour DELETE
CREATE TRIGGER decrement_group_participant_count
AFTER DELETE ON group_participants
FOR EACH ROW
EXECUTE FUNCTION update_group_participant_count();

-- Trigger pour UPDATE (changement de statut)
CREATE TRIGGER update_group_participant_count_on_status
AFTER UPDATE ON group_participants
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_group_participant_count();

-- ============================================
-- ÉTAPE 3: NETTOYAGE OPTIONNEL
-- ============================================

-- 3.1 Supprimer les groupes de test (DÉCOMMENTER SI NÉCESSAIRE)
-- DELETE FROM groups WHERE is_test_group = true;

-- 3.2 Supprimer les groupes abandonnés (DÉCOMMENTER SI NÉCESSAIRE)
-- DELETE FROM groups
-- WHERE current_participants = 0 
-- AND created_at < NOW() - INTERVAL '7 days'
-- AND status IN ('waiting', 'cancelled');

-- ============================================
-- ÉTAPE 4: VÉRIFICATION FINALE
-- ============================================

SELECT 
  '=== VÉRIFICATION FINALE ===' as section;

-- 4.1 Vérifier que les compteurs sont corrects
SELECT 
  g.id,
  g.status,
  g.current_participants as compteur_declare,
  COUNT(gp.id) as participants_reels,
  CASE 
    WHEN g.current_participants = COUNT(gp.id) THEN '✅ OK'
    ELSE '❌ ENCORE INCOHÉRENT'
  END as statut
FROM groups g
LEFT JOIN group_participants gp ON g.id = gp.group_id
GROUP BY g.id, g.status, g.current_participants
HAVING g.current_participants != COUNT(gp.id)
ORDER BY g.created_at DESC;

-- 4.2 Vérifier que les triggers sont bien créés
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'group_participants'
AND trigger_name LIKE '%group_participant_count%'
ORDER BY trigger_name;

-- 4.3 Statistiques finales
SELECT 
  COUNT(*) as total_groupes,
  SUM(current_participants) as total_participants,
  AVG(current_participants) as moyenne_participants,
  COUNT(CASE WHEN current_participants = 0 THEN 1 END) as groupes_vides,
  COUNT(CASE WHEN current_participants > 0 THEN 1 END) as groupes_actifs
FROM groups;

-- ============================================
-- RÉSUMÉ DES CORRECTIONS APPLIQUÉES
-- ============================================

SELECT 
  '=== ✅ CORRECTIONS TERMINÉES ===' as section;

SELECT 
  'Les corrections suivantes ont été appliquées:' as message
UNION ALL
SELECT '1. Recalcul de current_participants pour tous les groupes'
UNION ALL
SELECT '2. Création de la fonction update_group_participant_count()'
UNION ALL
SELECT '3. Création des triggers pour maintenir les compteurs à jour'
UNION ALL
SELECT '4. Vérification de la cohérence des données'
UNION ALL
SELECT ''
UNION ALL
SELECT '🎯 Prochaines étapes:'
UNION ALL
SELECT '- Tester la création d''un nouveau groupe'
UNION ALL
SELECT '- Vérifier qu''un participant est automatiquement créé'
UNION ALL
SELECT '- Tester la jointure d''un deuxième utilisateur'
UNION ALL
SELECT '- Vérifier que current_participants s''incrémente automatiquement';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

