# 🚨 INSTRUCTIONS URGENTES - Configuration MCP Supabase

**Date :** 19 Novembre 2025  
**Status :** ⚠️ Configuration MCP NON APPLIQUÉE  
**Action Requise :** IMMÉDIATE

---

## ❌ Problème Actuel

**Le MCP Supabase pointe TOUJOURS vers le mauvais projet** :
- ❌ **Actuel** : `https://allvgbnslcgrwvxjekjp.supabase.co` (jeu de simulation)
- ✅ **Attendu** : `https://xhrievvdnajvylyrowwu.supabase.co` (Random Rendezvous)

**Preuve** : Test effectué à l'instant → MCP retourne `allvgbnslcgrwvxjekjp`

---

## 📋 Configuration à Appliquer

### Configuration MCP Correcte

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xhrievvdnajvylyrowwu"
    }
  }
}
```

---

## 🔧 Comment Appliquer la Configuration

### Méthode 1 : Via l'Interface Cursor (RECOMMANDÉ)

1. **Ouvrir Cursor**
2. **Aller dans les Settings** :
   - Cmd+, (Mac) ou Ctrl+, (Windows/Linux)
   - Ou Menu → Cursor → Settings
3. **Chercher "MCP"** dans la barre de recherche
4. **Trouver la section "MCP Servers"**
5. **Modifier la configuration Supabase** :
   - Si une config `supabase` existe, la modifier
   - Sinon, l'ajouter
6. **Coller la configuration** :
   ```json
   {
     "url": "https://mcp.supabase.com/mcp?project_ref=xhrievvdnajvylyrowwu"
   }
   ```
7. **Sauvegarder**
8. **Redémarrer Cursor COMPLÈTEMENT** (Quitter et relancer)

### Méthode 2 : Via le Fichier de Configuration

#### Étape 1 : Localiser le Fichier de Config

**Chemins possibles** :
- Mac : `~/.cursor/mcp.json` ou `~/Library/Application Support/Cursor/mcp.json`
- Linux : `~/.config/cursor/mcp.json`
- Windows : `%APPDATA%\Cursor\mcp.json`

#### Étape 2 : Éditer le Fichier

```bash
# Mac/Linux
nano ~/.cursor/mcp.json

# Ou
code ~/.cursor/mcp.json
```

#### Étape 3 : Remplacer le Contenu

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xhrievvdnajvylyrowwu"
    }
  }
}
```

**⚠️ IMPORTANT** : Supprimer les anciennes configs `supabase_RANDOM` et `supabase_FRANCE_TRAVAIL` si présentes.

#### Étape 4 : Sauvegarder et Redémarrer

1. Sauvegarder le fichier
2. **Quitter Cursor complètement**
3. **Relancer Cursor**

---

## ✅ Validation de la Configuration

### Test 1 : Vérifier l'URL du Projet

Après redémarrage de Cursor, exécuter :

```bash
mcp_supabase_get_project_url()
```

**✅ Résultat CORRECT** : `https://xhrievvdnajvylyrowwu.supabase.co`  
**❌ Résultat INCORRECT** : `https://allvgbnslcgrwvxjekjp.supabase.co`

### Test 2 : Vérifier les Tables

```bash
mcp_supabase_execute_sql(query: "
  SELECT COUNT(*) FILTER (WHERE table_name = 'groups') as has_groups,
         COUNT(*) FILTER (WHERE table_name = 'bars') as has_bars
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
")
```

**✅ Résultat CORRECT** : `has_groups = 1`, `has_bars = 1`  
**❌ Résultat INCORRECT** : `has_groups = 0`, `has_bars = 0`

---

## 🔍 Dépannage

### Problème : La Configuration Ne S'Applique Pas

**Solutions possibles** :

1. **Vérifier le chemin du fichier de config**
   ```bash
   # Chercher tous les fichiers mcp.json
   find ~ -name "mcp.json" 2>/dev/null
   ```

2. **Vérifier les permissions du fichier**
   ```bash
   ls -la ~/.cursor/mcp.json
   chmod 644 ~/.cursor/mcp.json
   ```

3. **Supprimer le cache Cursor**
   ```bash
   # Mac
   rm -rf ~/Library/Caches/Cursor
   
   # Linux
   rm -rf ~/.cache/cursor
   ```

4. **Redémarrer l'ordinateur** (en dernier recours)

### Problème : Erreur "MCP Server Not Found"

**Solution** : Vérifier que le package MCP Supabase est installé :

```bash
npx -y @supabase/mcp-server --version
```

Si erreur, installer :

```bash
npm install -g @supabase/mcp-server
```

---

## 📊 Différence Attendue Après Configuration

### AVANT (Mauvais Projet - allvgbnslcgrwvxjekjp)

```
Tables: companies, products, game_sessions, inventories...
Total: 30 tables
Type: Jeu de simulation d'entreprise
```

### APRÈS (Bon Projet - xhrievvdnajvylyrowwu)

```
Tables: groups, bars, group_participants, scheduled_groups...
Total: 50+ tables
Type: Random Rendezvous (social/bars)
```

---

## 🎯 Une Fois la Configuration Appliquée

**Dites-moi simplement** :

> "go, refais l'audit"

Et je pourrai :
- ✅ Analyser les VRAIES tables Random Rendezvous
- ✅ Vérifier l'état réel du projet
- ✅ Identifier les vrais problèmes
- ✅ Appliquer les corrections nécessaires
- ✅ Redéployer les Edge Functions au bon endroit

---

## 📞 Checklist de Validation Finale

Après avoir appliqué la configuration et redémarré Cursor :

- [ ] `mcp_supabase_get_project_url()` retourne `xhrievvdnajvylyrowwu`
- [ ] Les tables `groups`, `bars`, `group_participants` existent
- [ ] Les tables `companies`, `products`, `game_sessions` n'existent PAS
- [ ] Le nombre total de tables est > 40 (pas 30)

**Si tous les points sont cochés** → Configuration réussie ! 🎉

---

## ⚠️ Note Importante

**SANS cette configuration correcte, AUCUNE analyse ni correction ne peut être effectuée sur le vrai projet Random Rendezvous.**

Toutes les analyses précédentes (géolocalisation, Paris, bars) restent valides car elles analysent le **code frontend**, mais les corrections backend (SQL, Edge Functions) doivent être appliquées sur le BON projet.

---

**Instructions créées le 19 Novembre 2025**  
**Status** : En attente d'application de la configuration MCP  
**Priorité** : 🚨 BLOQUANT


