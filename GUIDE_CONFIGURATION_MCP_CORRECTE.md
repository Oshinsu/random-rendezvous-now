# 🔧 Guide de Configuration MCP Supabase - Projet Correct

**Date :** 19 Novembre 2025  
**Projet Cible :** xhrievvdnajvylyrowwu (Random Rendezvous)

---

## 📋 Configuration MCP Correcte

### Configuration à Appliquer

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xhrievvdnajvylyrowwu"
    }
  }
}
```

### Où Appliquer la Configuration

**Option 1 : Via Cursor Settings**
1. Ouvrir Cursor
2. Aller dans Settings → MCP Servers
3. Ajouter/Modifier la configuration Supabase
4. Coller la configuration ci-dessus

**Option 2 : Via Fichier de Configuration**
1. Localiser le fichier de config MCP (probablement `~/.cursor/mcp.json`)
2. Éditer le fichier
3. Remplacer la section `supabase` par la configuration ci-dessus
4. Sauvegarder

### Après Configuration

1. **Redémarrer Cursor** complètement
2. **Tester la connexion** avec les commandes ci-dessous

---

## ✅ Tests de Validation

### Test 1 : Vérifier l'URL du Projet

```bash
mcp_supabase_get_project_url()
```

**Résultat attendu** : `https://xhrievvdnajvylyrowwu.supabase.co`

### Test 2 : Lister les Tables

```bash
mcp_supabase_list_tables(schemas: ["public"])
```

**Résultat attendu** : Liste contenant `groups`, `bars`, `group_participants`, etc.

### Test 3 : Vérifier les Tables Random Rendezvous

```sql
SELECT 
  COUNT(*) FILTER (WHERE table_name = 'groups') as has_groups,
  COUNT(*) FILTER (WHERE table_name = 'bars') as has_bars,
  COUNT(*) FILTER (WHERE table_name = 'group_participants') as has_group_participants,
  COUNT(*) FILTER (WHERE table_name = 'scheduled_groups') as has_scheduled_groups,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

**Résultat attendu** :
- `has_groups = 1`
- `has_bars = 1`
- `has_group_participants = 1`
- `has_scheduled_groups = 1`
- `total_tables > 20`

### Test 4 : Vérifier les Données

```sql
-- Groupes récents
SELECT id, location_name, status, current_participants, bar_name, created_at
FROM groups
ORDER BY created_at DESC
LIMIT 5;

-- Bars actifs
SELECT id, name, city, is_active, subscription_status
FROM bars
WHERE is_active = true
LIMIT 5;

-- Participants actifs
SELECT COUNT(*) as total_participants
FROM group_participants
WHERE status = 'confirmed';
```

---

## 🎯 Prochaines Étapes Après Configuration

Une fois la configuration MCP correcte appliquée et validée :

1. ✅ Vérifier l'état des tables
2. ✅ Vérifier les fonctions PostgreSQL
3. ✅ Vérifier les triggers
4. ✅ Vérifier les Edge Functions déployées
5. ✅ Appliquer les corrections nécessaires
6. ✅ Redéployer les Edge Functions sur le bon projet

---

## 📊 Différences Attendues

### Ancien Projet (allvgbnslcgrwvxjekjp)
- ❌ 30 tables de jeu de simulation
- ❌ Tables : companies, products, game_sessions
- ❌ Pas de tables Random Rendezvous

### Nouveau Projet (xhrievvdnajvylyrowwu)
- ✅ Tables Random Rendezvous
- ✅ Tables : groups, bars, group_participants
- ✅ Tables : scheduled_groups, notifications, campaigns
- ✅ Migrations appliquées (196 fichiers)

---

**Une fois la configuration appliquée, demandez-moi de refaire l'audit complet sur le BON projet !**


