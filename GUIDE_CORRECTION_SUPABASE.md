# 🚨 Guide de Correction Urgente - Configuration Supabase

**Date :** 19 Novembre 2025  
**Priorité :** BLOQUANT - À corriger IMMÉDIATEMENT  
**Impact :** Application totalement non fonctionnelle

---

## 🔍 Problème Identifié

Tous les MCPs Supabase configurés (`supabase`, `supabase_RANDOM`, `supabase_FRANCE_TRAVAIL`) pointent vers un **projet de jeu de simulation d'entreprise** au lieu du projet **Random Rendezvous**.

### Preuve

**Tables détectées dans le projet actuel** :
- `companies`, `products`, `game_sessions`, `production_lines`
- `marketing_campaigns`, `supply_contracts`, `rd_projects`
- `internal_ai_systems`, `world_events`, `telemetry_events`

**Tables attendues pour Random Rendezvous** (ABSENTES) :
- ❌ `groups`
- ❌ `bars`
- ❌ `group_participants`
- ❌ `users` (table custom)
- ❌ `scheduled_groups`
- ❌ `bar_subscriptions`
- ❌ `notifications`
- ❌ `campaigns`

---

## 📋 Plan de Correction (Étapes Détaillées)

### Étape 1 : Identifier le Vrai Projet Supabase

#### 1.1 Vérifier les Variables d'Environnement

**Fichiers à vérifier** :
```bash
# Dans le projet Random Rendezvous
cat .env
cat .env.local
cat .env.production
```

**Variables à chercher** :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### 1.2 Vérifier le Code Frontend

**Fichier** : `src/integrations/supabase/client.ts`

```typescript
// Chercher ces lignes :
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

#### 1.3 Vérifier les Edge Functions

**Fichiers** : `supabase/functions/*/index.ts`

```typescript
// Chercher ces lignes :
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
```

---

### Étape 2 : Identifier les Projets Supabase Disponibles

#### 2.1 Se Connecter à Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Lister tous les projets disponibles
3. Identifier le projet "Random Rendezvous" ou similaire

#### 2.2 Vérifier les URLs des Projets

**Format URL Supabase** : `https://[PROJECT_REF].supabase.co`

**Projets détectés dans le code** :
- `xhrievvdnajvylyrowwu.supabase.co` (trouvé dans les migrations)

#### 2.3 Tester Chaque Projet

Pour chaque projet trouvé, exécuter :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('groups', 'bars', 'group_participants')
ORDER BY table_name;
```

Si cette requête retourne les 3 tables → **C'est le bon projet !**

---

### Étape 3 : Reconfigurer les MCPs Supabase

#### 3.1 Localiser la Configuration MCP

**Fichier de configuration MCP** (probablement) :
- `~/.config/cursor/mcp-config.json`
- Ou dans les settings Cursor

#### 3.2 Mettre à Jour les Credentials

**Format attendu** :
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://[CORRECT_PROJECT_REF].supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[CORRECT_SERVICE_ROLE_KEY]"
      }
    }
  }
}
```

**⚠️ IMPORTANT** : Utiliser la **SERVICE_ROLE_KEY**, pas l'ANON_KEY, pour les MCPs.

#### 3.3 Redémarrer Cursor

Après modification de la config MCP, redémarrer Cursor complètement.

---

### Étape 4 : Vérifier la Connexion

#### 4.1 Tester la Connexion MCP

```bash
# Dans Cursor, exécuter :
mcp_supabase_list_tables(schemas: ["public"])
```

**Résultat attendu** : Liste contenant `groups`, `bars`, `group_participants`, etc.

#### 4.2 Vérifier les Données

```sql
-- Compter les groupes
SELECT COUNT(*) as total_groups FROM groups;

-- Compter les bars
SELECT COUNT(*) as total_bars FROM bars;

-- Compter les participants
SELECT COUNT(*) as total_participants FROM group_participants;
```

---

### Étape 5 : Appliquer les Migrations (Si Nécessaire)

#### 5.1 Vérifier les Migrations Appliquées

```sql
SELECT version, name, executed_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 20;
```

#### 5.2 Si les Tables Manquent

**Il y a 196 fichiers SQL dans `supabase/migrations/`**

**Option A : Via Supabase CLI** (Recommandé)
```bash
# Se connecter au projet
supabase link --project-ref [PROJECT_REF]

# Appliquer toutes les migrations
supabase db push
```

**Option B : Via MCP** (Manuel)
```bash
# Pour chaque migration dans l'ordre chronologique
mcp_supabase_apply_migration(
  name: "nom_migration",
  query: "CONTENU_SQL"
)
```

**Option C : Via Dashboard Supabase**
1. Aller dans SQL Editor
2. Copier-coller chaque migration
3. Exécuter dans l'ordre chronologique

---

## 🔍 Diagnostic Rapide

### Test 1 : Vérifier le Projet Actuel

```sql
-- Exécuter dans le projet actuel
SELECT 
  COUNT(*) FILTER (WHERE table_name = 'groups') as has_groups,
  COUNT(*) FILTER (WHERE table_name = 'bars') as has_bars,
  COUNT(*) FILTER (WHERE table_name = 'companies') as has_companies,
  COUNT(*) FILTER (WHERE table_name = 'products') as has_products
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Résultat attendu pour Random Rendezvous** :
- `has_groups = 1`
- `has_bars = 1`
- `has_companies = 0`
- `has_products = 0`

**Résultat actuel (mauvais projet)** :
- `has_groups = 0`
- `has_bars = 0`
- `has_companies = 1`
- `has_products = 1`

### Test 2 : Vérifier les Variables d'Environnement

```bash
# Dans le terminal du projet
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

Si vide → Chercher dans `.env` ou `.env.local`

---

## 📞 Checklist de Validation

Après correction, vérifier :

- [ ] MCP Supabase pointe vers le bon projet
- [ ] `mcp_supabase_list_tables` retourne les tables Random Rendezvous
- [ ] La table `groups` existe
- [ ] La table `bars` existe
- [ ] La table `group_participants` existe
- [ ] Les Edge Functions sont déployées sur le bon projet
- [ ] Les variables d'environnement frontend sont correctes
- [ ] L'application frontend se connecte au bon projet

---

## 🚀 Après Correction

Une fois le bon projet configuré, exécuter les analyses suivantes :

1. **Vérifier les fonctions PostgreSQL**
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name IN ('create_group_with_participant', 'trigger_auto_bar_assignment')
   ORDER BY routine_name;
   ```

2. **Vérifier les triggers**
   ```sql
   SELECT trigger_name, event_object_table, action_statement
   FROM information_schema.triggers 
   WHERE event_object_table IN ('groups', 'group_participants')
   ORDER BY trigger_name;
   ```

3. **Vérifier les données de test**
   ```sql
   -- Groupes récents
   SELECT id, location_name, status, current_participants, created_at
   FROM groups
   ORDER BY created_at DESC
   LIMIT 10;
   
   -- Bars actifs
   SELECT id, name, city, subscription_status, is_active
   FROM bars
   WHERE is_active = true
   LIMIT 10;
   ```

---

## 📝 Notes Importantes

1. **SERVICE_ROLE_KEY vs ANON_KEY**
   - MCPs doivent utiliser la **SERVICE_ROLE_KEY** (accès admin)
   - Frontend utilise l'**ANON_KEY** (accès limité par RLS)

2. **Sécurité**
   - Ne JAMAIS commiter la SERVICE_ROLE_KEY dans Git
   - Utiliser des variables d'environnement

3. **Projets Multiples**
   - Si vous avez plusieurs projets Supabase, bien documenter lequel est pour Random Rendezvous
   - Renommer les projets dans le dashboard pour éviter la confusion

---

**Temps Estimé de Correction** : 30-60 minutes

**Contact** : Si problème persistant, vérifier les logs Supabase dans le Dashboard → Logs → API


