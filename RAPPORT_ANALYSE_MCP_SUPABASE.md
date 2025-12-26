# 🔍 Rapport d'Analyse des MCPs Supabase - Random Rendezvous

**Date :** 19 Novembre 2025  
**Analyste :** Assistant AI  
**Nombre de MCPs Analysés :** 3

---

## 📊 Résumé Exécutif

### Configuration Actuelle

**Tous les 3 MCPs Supabase pointent vers le MÊME projet** :
- **URL** : `https://allvgbnslcgrwvxjekjp.supabase.co`
- **MCPs Configurés** :
  - `supabase` → `allvgbnslcgrwvxjekjp`
  - `supabase_RANDOM` → `allvgbnslcgrwvxjekjp`
  - `supabase_FRANCE_TRAVAIL` → `allvgbnslcgrwvxjekjp`

### 🚨 PROBLÈME CRITIQUE IDENTIFIÉ

**Le frontend Random Rendezvous pointe vers un PROJET DIFFÉRENT** :
- **URL Frontend** : `https://xhrievvdnajvylyrowwu.supabase.co`
- **Fichier** : `src/integrations/supabase/client.ts` (ligne 8)

```typescript
const SUPABASE_URL = "https://xhrievvdnajvylyrowwu.supabase.co";
```

**Conséquence** : Les MCPs et le frontend ne communiquent PAS avec le même projet Supabase !

---

## 1. 🔍 Analyse Détaillée : Projet MCP (allvgbnslcgrwvxjekjp)

### URL Complète
```
https://allvgbnslcgrwvxjekjp.supabase.co
```

### Tables Disponibles (30 tables)

| Table | Type | Description |
|-------|------|-------------|
| `ai_plans` | Base | Plans IA pour simulation |
| `analytics` | Base | Analytics génériques |
| `app_secrets` | Base | Secrets application |
| `audits` | Base | Audits leads |
| `cache_entries` | Base | Cache système |
| `chat_messages` | Base | Messages chat |
| `chat_sessions` | Base | Sessions chat |
| `companies` | Base | **JEU DE SIMULATION** - Entreprises |
| `conversational_employees` | Base | Employés conversationnels |
| `credentials` | Base | Credentials utilisateurs |
| `employee_conversations` | Base | Conversations avec employés IA |
| `favorites` | Base | Favoris utilisateurs |
| `game_sessions` | Base | **JEU DE SIMULATION** - Sessions de jeu |
| `generated_images` | Base | Images générées par IA |
| `internal_ai_systems` | Base | Systèmes IA internes |
| `inventories` | Base | **JEU DE SIMULATION** - Inventaires |
| `leads` | Base | Leads commerciaux |
| `market_segments` | Base | **JEU DE SIMULATION** - Segments de marché |
| `marketing_campaigns` | Base | **JEU DE SIMULATION** - Campagnes marketing |
| `production_lines` | Base | **JEU DE SIMULATION** - Lignes de production |
| `products` | Base | **JEU DE SIMULATION** - Produits |
| `profiles` | Base | Profils utilisateurs génériques |
| `questionnaire_results` | Base | Résultats questionnaires |
| `rd_projects` | Base | **JEU DE SIMULATION** - Projets R&D |
| `search_history` | Base | Historique recherches |
| `sites` | Base | **JEU DE SIMULATION** - Sites de production |
| `supply_contracts` | Base | **JEU DE SIMULATION** - Contrats fournisseurs |
| `telemetry_events` | Base | Événements télémétrie |
| `user_profiles` | Base | Profils utilisateurs détaillés |
| `world_events` | Base | **JEU DE SIMULATION** - Événements mondiaux |

### 🎮 Nature du Projet

**C'est un jeu de simulation d'entreprise / stratégie** avec :
- Gestion d'entreprises (companies, products, inventories)
- Production industrielle (production_lines, sites)
- Recherche & Développement (rd_projects)
- Marketing (marketing_campaigns, market_segments)
- Simulation économique (world_events, supply_contracts)
- IA conversationnelle (conversational_employees, employee_conversations)

### ❌ Tables Random Rendezvous ABSENTES

Les tables essentielles pour Random Rendezvous **n'existent PAS** :
- ❌ `groups`
- ❌ `bars`
- ❌ `group_participants`
- ❌ `scheduled_groups`
- ❌ `bar_subscriptions`
- ❌ `notifications`
- ❌ `campaigns` (email CRM)
- ❌ `user_activity`
- ❌ `referrals`
- ❌ `events`

### Fonctions PostgreSQL (48 fonctions)

**Fonctions Utilitaires** :
- ✅ `cleanup_expired_cache`
- ✅ `cleanup_expired_employees`
- ✅ `cleanup_expired_images`
- ✅ `cleanup_old_analytics`
- ✅ `cleanup_old_search_history`
- ✅ `get_secret`
- ✅ `validate_jsonb_schema`
- ✅ `is_valid_email`
- ✅ `is_valid_french_postal_code`
- ✅ `is_valid_french_department`

**Fonctions Spécifiques Jeu** :
- ✅ `update_employee_last_interaction`
- ✅ `update_marketing_campaigns_updated_at`
- ✅ `update_supply_contracts_updated_at`

**Fonctions pg_trgm** (Recherche floue) :
- 30+ fonctions pour la recherche par similarité

### Edge Functions Déployées (7 fonctions)

| Fonction | Status | Description |
|----------|--------|-------------|
| `validate-oauth-request` | ✅ ACTIVE | Validation OAuth (Google) |
| `send-zoho-email` | ✅ ACTIVE | Envoi emails Zoho |
| `process-campaign-queue` | ✅ ACTIVE | Traitement queue emails |
| `check-bar-subscription` | ✅ ACTIVE | Vérification abonnement bars |
| `send-push-notification` | ✅ ACTIVE | Envoi notifications push |
| `lifecycle-automations` | ✅ ACTIVE | Automations lifecycle |
| `trigger-bar-assignment` | ✅ ACTIVE | Déclenchement assignation bar |

**Note** : Ces Edge Functions ont été déployées lors de l'audit précédent.

---

## 2. 🔍 Analyse Détaillée : Projet Frontend (xhrievvdnajvylyrowwu)

### URL Complète
```
https://xhrievvdnajvylyrowwu.supabase.co
```

### ⚠️ IMPOSSIBLE D'ANALYSER

**Raison** : Les MCPs ne sont pas configurés pour ce projet.

**Fichier de Configuration** : `src/integrations/supabase/client.ts`

```typescript:8:9:src/integrations/supabase/client.ts
const SUPABASE_URL = "https://xhrievvdnajvylyrowwu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs";
```

**JWT Décodé** :
```json
{
  "iss": "supabase",
  "ref": "xhrievvdnajvylyrowwu",
  "role": "anon",
  "iat": 1749894535,
  "exp": 2065470535
}
```

- **Projet** : `xhrievvdnajvylyrowwu`
- **Rôle** : `anon` (public API key)
- **Expiration** : 2065 (valide 40 ans)

### 🔍 Hypothèses sur ce Projet

**C'est probablement le VRAI projet Random Rendezvous** car :
1. Le frontend y est connecté
2. Les migrations SQL (196 fichiers) sont présentes dans le repo
3. Les Edge Functions sont définies dans `supabase/functions/`
4. Le code TypeScript fait référence à des tables comme `groups`, `bars`, etc.

---

## 3. 📊 Comparaison des Deux Projets

| Critère | MCP (allvgbnslcgrwvxjekjp) | Frontend (xhrievvdnajvylyrowwu) |
|---------|---------------------------|----------------------------------|
| **URL** | `allvgbnslcgrwvxjekjp.supabase.co` | `xhrievvdnajvylyrowwu.supabase.co` |
| **Type** | Jeu de simulation d'entreprise | Random Rendezvous (social/bars) |
| **Tables** | 30 tables (companies, products, etc.) | Inconnues (non accessible) |
| **MCPs** | ✅ Configurés (3 MCPs) | ❌ Non configurés |
| **Frontend** | ❌ Non connecté | ✅ Connecté |
| **Edge Functions** | 7 déployées (lors audit) | Inconnu |
| **Migrations** | Inconnues | 196 fichiers SQL présents |

---

## 4. 🚨 Impact de la Discordance

### Problèmes Actuels

1. **Déploiements Edge Functions**
   - ✅ Les 7 Edge Functions ont été déployées sur `allvgbnslcgrwvxjekjp`
   - ❌ Elles devraient être sur `xhrievvdnajvylyrowwu`
   - **Conséquence** : Les fonctions ne sont pas accessibles au frontend

2. **Corrections SQL**
   - ✅ La migration `fix_jsonb_triggers` a été appliquée sur `allvgbnslcgrwvxjekjp`
   - ❌ Elle devrait être sur `xhrievvdnajvylyrowwu`
   - **Conséquence** : Le bug SQL persiste sur le vrai projet

3. **Analyses de Base de Données**
   - ❌ Toutes les analyses ont porté sur le mauvais projet
   - ❌ Impossibilité de vérifier l'état réel du projet Random Rendezvous

---

## 5. 📋 Plan de Correction URGENT

### Étape 1 : Reconfigurer les MCPs (IMMÉDIAT)

**Objectif** : Pointer les MCPs vers `xhrievvdnajvylyrowwu`

#### Méthode 1 : Via Configuration MCP (Recommandée)

**Fichier de configuration MCP** (probablement `~/.config/cursor/mcp-config.json`) :

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://xhrievvdnajvylyrowwu.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[À RÉCUPÉRER DU DASHBOARD]"
      }
    }
  }
}
```

**⚠️ IMPORTANT** : Récupérer la **SERVICE_ROLE_KEY** (pas l'ANON_KEY) depuis le dashboard Supabase :
1. Aller sur https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/settings/api
2. Copier la **service_role key** (section "Project API keys")

#### Méthode 2 : Supprimer les MCPs Dupliqués

Si vous n'avez besoin que d'un seul MCP Supabase :
- Supprimer `supabase_RANDOM` de la config
- Supprimer `supabase_FRANCE_TRAVAIL` de la config
- Garder uniquement `supabase` pointant vers `xhrievvdnajvylyrowwu`

### Étape 2 : Redémarrer Cursor

Après modification de la configuration MCP, **redémarrer complètement Cursor**.

### Étape 3 : Vérifier la Connexion

Tester la connexion au bon projet :

```bash
# Dans Cursor, exécuter :
mcp_supabase_list_tables(schemas: ["public"])
```

**Résultat attendu** : Liste contenant `groups`, `bars`, `group_participants`, etc.

### Étape 4 : Vérifier les Tables

```sql
SELECT 
  COUNT(*) FILTER (WHERE table_name = 'groups') as has_groups,
  COUNT(*) FILTER (WHERE table_name = 'bars') as has_bars,
  COUNT(*) FILTER (WHERE table_name = 'group_participants') as has_group_participants,
  COUNT(*) FILTER (WHERE table_name = 'users') as has_users,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

**Résultat attendu** :
- `has_groups = 1`
- `has_bars = 1`
- `has_group_participants = 1`
- `has_users = 1` (ou 0 si table gérée par auth.users)
- `total_tables > 30`

### Étape 5 : Redéployer les Edge Functions

Les 7 Edge Functions doivent être redéployées sur le BON projet :

```bash
# Utiliser le script créé
./deploy_all_functions.sh
```

Ou via MCPs :
- `mcp_supabase_deploy_edge_function` pour chaque fonction

### Étape 6 : Réappliquer les Corrections SQL

La migration `fix_jsonb_triggers` doit être réappliquée sur le vrai projet :

```bash
mcp_supabase_apply_migration(
  name: "fix_jsonb_triggers_correct_project",
  query: "-- Contenu de 20251119_fix_jsonb_triggers.sql"
)
```

---

## 6. 🔍 Vérifications Post-Correction

### Checklist de Validation

Après reconfiguration, vérifier :

- [ ] MCP pointe vers `xhrievvdnajvylyrowwu.supabase.co`
- [ ] `mcp_supabase_list_tables` retourne les tables Random Rendezvous
- [ ] La table `groups` existe et contient des données
- [ ] La table `bars` existe et contient des données
- [ ] Les Edge Functions sont déployées sur le bon projet
- [ ] Les migrations SQL sont appliquées
- [ ] Les fonctions PostgreSQL existent (`create_group_with_participant`, etc.)
- [ ] Les triggers sont actifs
- [ ] L'application frontend fonctionne

### Tests Fonctionnels

1. **Test Géolocalisation**
   ```sql
   -- Vérifier les groupes récents
   SELECT id, location_name, latitude, longitude, status, current_participants, created_at
   FROM groups
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Test Bars**
   ```sql
   -- Vérifier les bars actifs
   SELECT id, name, city, address, is_active, subscription_status
   FROM bars
   WHERE is_active = true
   LIMIT 10;
   ```

3. **Test Participants**
   ```sql
   -- Vérifier les participations actives
   SELECT COUNT(*) as total_participants,
          COUNT(DISTINCT group_id) as total_groups,
          COUNT(DISTINCT user_id) as total_users
   FROM group_participants
   WHERE status = 'confirmed';
   ```

---

## 7. 📊 Statistiques du Projet MCP (Mauvais Projet)

### Résumé

- **30 tables** (jeu de simulation)
- **48 fonctions PostgreSQL** (dont 30 pour pg_trgm)
- **7 Edge Functions déployées** (lors de l'audit précédent)
- **0 table Random Rendezvous**

### Nature du Projet

**Jeu de Stratégie d'Entreprise** :
- Simulation économique
- Gestion d'entreprises
- Production industrielle
- Recherche & Développement
- Marketing
- IA conversationnelle

**Stack Technique** :
- PostgreSQL
- Extension pg_trgm (recherche floue)
- Auth Supabase
- Storage Supabase (images générées)
- Edge Functions Supabase

---

## 8. 🎯 Conclusion

### Découverte Principale

**Les 3 MCPs Supabase pointent vers le même projet** (`allvgbnslcgrwvxjekjp`), qui est un **jeu de simulation d'entreprise**, pas Random Rendezvous.

**Le vrai projet Random Rendezvous** est sur `xhrievvdnajvylyrowwu` (connecté au frontend), mais **non accessible via les MCPs**.

### Impact

1. ❌ Toutes les analyses de base de données ont porté sur le mauvais projet
2. ❌ Les Edge Functions ont été déployées sur le mauvais projet
3. ❌ Les corrections SQL ont été appliquées sur le mauvais projet
4. ❌ Impossible de vérifier l'état réel du projet Random Rendezvous

### Action Immédiate Requise

**Reconfigurer les MCPs pour pointer vers `xhrievvdnajvylyrowwu`** et refaire l'audit complet du vrai projet.

---

## 9. 📝 Informations Complémentaires

### Projets Supabase Identifiés

1. **allvgbnslcgrwvxjekjp** (MCPs actuels)
   - Type : Jeu de simulation d'entreprise
   - Tables : 30 (companies, products, game_sessions, etc.)
   - Accessible via MCPs : ✅

2. **xhrievvdnajvylyrowwu** (Frontend)
   - Type : Random Rendezvous (social/bars)
   - Tables : Inconnues (probablement groups, bars, etc.)
   - Accessible via MCPs : ❌

### Clés API Identifiées

**Projet xhrievvdnajvylyrowwu** :
- **ANON_KEY** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (dans `client.ts`)
- **SERVICE_ROLE_KEY** : À récupérer du dashboard

### Fichiers de Configuration

- **Frontend** : `src/integrations/supabase/client.ts`
- **Migrations** : `supabase/migrations/` (196 fichiers)
- **Edge Functions** : `supabase/functions/` (61 fonctions)
- **MCP Config** : Probablement `~/.config/cursor/mcp-config.json`

---

**Rapport généré le 19 Novembre 2025**  
**Analyste** : Assistant AI  
**Version** : 1.0 - Analyse Complète des MCPs Supabase


