# 🔍 DIAGNOSTIC DES GROUPES - Random Rendezvous

## 📊 Données Observées (via list_tables)

### Table `groups`
- **Rows:** 21 groupes
- **RLS:** ✅ Activé
- **Colonnes clés:**
  - `current_participants` (integer)
  - `max_participants` (integer, default 5)
  - `status` (text: waiting, confirmed, completed, cancelled, awaiting_payment)

### Table `group_participants`
- **Rows:** 1 participant seulement
- **RLS:** ✅ Activé
- **Colonnes clés:**
  - `group_id` (FK vers groups)
  - `user_id` (FK vers auth.users)
  - `status` (text: pending, confirmed, cancelled)

## 🚨 PROBLÈME IDENTIFIÉ

**21 groupes créés mais seulement 1 participant enregistré !**

### Hypothèses possibles:

#### 1️⃣ **Problème de création de groupe**
Le processus de création ne crée pas automatiquement un `group_participant` pour le créateur.

**Solution:** Vérifier la fonction `create_group` ou le code frontend qui crée les groupes.

#### 2️⃣ **Problème de jointure**
Les utilisateurs ne rejoignent pas les groupes après leur création.

**Solution:** Vérifier la fonction `join_group` et le flow utilisateur.

#### 3️⃣ **Problème de trigger**
Un trigger devrait créer automatiquement un participant lors de la création d'un groupe, mais il ne fonctionne pas.

**Solution:** Vérifier les triggers sur la table `groups`.

#### 4️⃣ **Données de test**
Les 21 groupes sont peut-être des groupes de test créés manuellement sans participants.

**Solution:** Vérifier le champ `is_test_group` et nettoyer les données de test.

## 🔧 REQUÊTES DE DIAGNOSTIC

### 1. Analyser les groupes
\`\`\`sql
SELECT 
  id,
  status,
  created_at,
  current_participants,
  max_participants,
  bar_name,
  is_scheduled,
  is_test_group,
  created_by_user_id
FROM public.groups
ORDER BY created_at DESC;
\`\`\`

### 2. Vérifier les participants
\`\`\`sql
SELECT 
  gp.id,
  gp.group_id,
  gp.user_id,
  gp.status,
  gp.joined_at,
  g.status as group_status,
  g.bar_name
FROM public.group_participants gp
JOIN public.groups g ON gp.group_id = g.id
ORDER BY gp.joined_at DESC;
\`\`\`

### 3. Compter les participants par groupe
\`\`\`sql
SELECT 
  g.id,
  g.status,
  g.current_participants as declared_count,
  COUNT(gp.id) as actual_count,
  CASE 
    WHEN g.current_participants = COUNT(gp.id) THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END as status_check
FROM public.groups g
LEFT JOIN public.group_participants gp ON g.id = gp.group_id
GROUP BY g.id, g.status, g.current_participants
ORDER BY g.created_at DESC;
\`\`\`

### 4. Vérifier les triggers
\`\`\`sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('groups', 'group_participants')
ORDER BY event_object_table, trigger_name;
\`\`\`

### 5. Vérifier les fonctions PostgreSQL liées aux groupes
\`\`\`sql
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%group%'
ORDER BY routine_name;
\`\`\`

## 🛠️ CORRECTIONS POSSIBLES

### Option A: Recalculer current_participants
\`\`\`sql
-- Mettre à jour current_participants pour tous les groupes
UPDATE public.groups g
SET current_participants = (
  SELECT COUNT(*)
  FROM public.group_participants gp
  WHERE gp.group_id = g.id
  AND gp.status = 'confirmed'
);
\`\`\`

### Option B: Créer un trigger pour maintenir current_participants
\`\`\`sql
-- Fonction pour mettre à jour le compteur
CREATE OR REPLACE FUNCTION update_group_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups
    SET current_participants = current_participants + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger sur INSERT
CREATE TRIGGER increment_group_participant_count
AFTER INSERT ON public.group_participants
FOR EACH ROW
EXECUTE FUNCTION update_group_participant_count();

-- Trigger sur DELETE
CREATE TRIGGER decrement_group_participant_count
AFTER DELETE ON public.group_participants
FOR EACH ROW
EXECUTE FUNCTION update_group_participant_count();
\`\`\`

### Option C: Nettoyer les groupes de test
\`\`\`sql
-- Supprimer les groupes de test sans participants
DELETE FROM public.groups
WHERE is_test_group = true
OR (current_participants = 0 AND created_at < NOW() - INTERVAL '7 days');
\`\`\`

## 📝 RECOMMANDATIONS

1. **Exécuter les requêtes de diagnostic** dans le SQL Editor de Supabase
2. **Identifier la cause racine** (création, jointure, trigger, ou données de test)
3. **Appliquer la correction appropriée** selon le diagnostic
4. **Tester le flow complet** de création/jointure de groupe
5. **Monitorer** les nouveaux groupes créés

## ⚠️ ATTENTION

Avant d'appliquer des corrections:
- Faire un backup de la base de données
- Tester sur un environnement de staging
- Vérifier l'impact sur les utilisateurs actifs
- Documenter les changements appliqués

---

**Statut:** 🟡 EN ATTENTE DE DIAGNOSTIC  
**Priorité:** 🔴 HAUTE (impacte la fonctionnalité principale)  
**Impact utilisateur:** Potentiellement critique si les groupes ne se forment pas correctement

