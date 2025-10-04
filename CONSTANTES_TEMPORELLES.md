# 📐 Constantes temporelles de l'architecture Random

## 🎯 Source de Vérité (SSOT)

**Fonction PostgreSQL principale** : `get_user_active_groups(user_uuid, include_scheduled)`

Cette fonction définit les critères **définitifs** pour déterminer si une participation est considérée comme "active".

### Seuils SSOT (Source de vérité absolue)

```sql
-- Dans get_user_active_groups()
activity_threshold CONSTANT interval := '24 hours';
group_age_limit CONSTANT interval := '7 days';
```

- **Activité utilisateur** : `24 heures` (participant considéré actif si last_seen < 24h)
- **Âge de groupe** : `7 jours` (groupe considéré valide si created_at < 7 jours)

## 📊 Alignement Frontend/Backend

| Concept | Frontend | Backend (SSOT) | Aligné ? |
|---------|----------|----------------|----------|
| Utilisateur connecté (temps réel) | 60 min | 60 min | ✅ |
| Participation active (cleanup) | 24h | 24h | ✅ |
| Groupe valide (cleanup) | 7 jours | 7 jours | ✅ |
| Heartbeat interval | 1h | 1h | ✅ |
| Cleanup cron | 6h | 6h | ✅ |

## 🏗️ Hiérarchie des constantes

```
1. SSOT PostgreSQL (get_user_active_groups) ← Source ultime
   ↓
2. Frontend constants (groupConstants.ts) ← Doivent correspondre au SSOT
   ↓
3. Code applicatif ← Utilise les constantes, jamais de valeurs hardcodées
```

## 📝 Définitions des concepts

### 1. "Connecté en temps réel" (60 minutes)

**Définition** : Un utilisateur est considéré comme "connecté" s'il a envoyé un signal de vie (heartbeat) dans les 60 dernières minutes.

**Où c'est utilisé** :
- `isUserConnected()` dans `src/services/unifiedGroupService.ts`
- `is_user_connected_realtime()` dans PostgreSQL
- Affichage des indicateurs de connexion dans l'UI

**Constante** : `GROUP_CONSTANTS.HEARTBEAT_INTERVAL` = 60 minutes

**Pourquoi 60 minutes ?** : Le heartbeat envoie un signal toutes les heures, donc un utilisateur est "connecté" jusqu'à 60 minutes après son dernier signal.

### 2. "Participation active" (24 heures)

**Définition** : Une participation est considérée comme "active" si le `last_seen` du participant est inférieur à 24 heures.

**Où c'est utilisé** :
- `get_user_active_groups()` dans PostgreSQL (SSOT)
- `dissolve_old_groups()` pour le nettoyage automatique
- `check_user_participation_limit()` pour vérifier si un utilisateur peut créer un groupe

**Constante** : `GROUP_CONSTANTS.PARTICIPANT_ACTIVITY_THRESHOLD` = 24 heures

**Pourquoi 24 heures ?** : Permet aux utilisateurs de garder leur groupe actif même s'ils ferment l'app et reviennent le lendemain.

### 3. "Groupe valide" (7 jours)

**Définition** : Un groupe est considéré comme "valide" si son `created_at` est inférieur à 7 jours.

**Où c'est utilisé** :
- `get_user_active_groups()` dans PostgreSQL (SSOT)
- `dissolve_old_groups()` pour le nettoyage automatique
- `find_compatible_group_fixed()` pour la recherche de groupes

**Constante** : `GROUP_CONSTANTS.MAX_GROUP_AGE_FOR_JOIN` = 7 jours

**Pourquoi 7 jours ?** : Protection contre les groupes "zombies" très anciens qui n'ont jamais été complétés.

## 🔄 Fréquences de rafraîchissement

### Heartbeat (1 heure)
- **Fonction** : `updateUserLastSeen()` dans `useActivityHeartbeat`
- **Fréquence** : Toutes les heures
- **But** : Signaler que l'utilisateur est toujours présent dans le groupe

### React Query refetch (5 minutes)
- **Fonction** : `useQuery` dans `useUnifiedGroups`
- **Fréquence** : Toutes les 5 minutes
- **But** : Rafraîchir l'affichage des groupes et membres

### React Query stale time (2 minutes)
- **Fonction** : `useQuery` dans `useUnifiedGroups`
- **Durée** : 2 minutes
- **But** : Éviter les requêtes inutiles si les données sont fraîches

### Cleanup cron (6 heures)
- **Fonction** : `dissolve_old_groups()` via Supabase cron
- **Fréquence** : Toutes les 6 heures (0 */6 * * *)
- **But** : Nettoyer les participations inactives et les groupes anciens

## 🔍 Exemples de flux

### Exemple 1 : Utilisateur crée un groupe

```
T=0     : Utilisateur crée un groupe
          - last_seen = NOW()
          - created_at = NOW()

T+30min : Heartbeat envoie un signal
          - last_seen = NOW()
          - isUserConnected() = true ✅

T+1h    : Heartbeat envoie un signal
          - last_seen = NOW()
          - isUserConnected() = true ✅

T+2h    : Utilisateur ferme l'app (pas de heartbeat)
          - last_seen = T+1h (inchangé)
          - isUserConnected() = false ❌ (> 60 min)
          - Participation toujours active ✅ (< 24h)

T+20h   : Utilisateur revient
          - last_seen = T+1h (toujours)
          - get_user_active_groups() = 1 groupe ✅
          - Participation toujours active ✅

T+25h   : Cleanup cron s'exécute
          - last_seen = T+1h (> 24h)
          - dissolve_old_groups() supprime la participation ❌
          - Groupe passe en "cancelled" si vide
```

### Exemple 2 : Groupe complet

```
T=0     : Groupe créé avec 1 participant
T+10min : 2e participant rejoint
T+20min : 3e participant rejoint
T+30min : 4e participant rejoint
T+40min : 5e participant rejoint
          - current_participants = 5
          - status = 'confirmed'
          - Bar automatiquement assigné 🎉

T+2h    : meeting_time (dans 1h)
T+3h    : Groupe se déroule
T+3h45  : meeting_time + 45 minutes
          - transition_groups_to_completed()
          - status = 'completed'
          - Historique créé pour chaque participant

T+3 jours : Cleanup cron
          - dissolve_old_groups() supprime le groupe completed
```

## ⚠️ Points d'attention

### 1. Ne JAMAIS hardcoder des valeurs temporelles

```typescript
// ❌ MAUVAIS
const diffMinutes = 10;
const heartbeatInterval = 15 * 60 * 1000;

// ✅ BON
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
const connectionThreshold = 60; // Aligné avec GROUP_CONSTANTS.HEARTBEAT_INTERVAL
const heartbeatInterval = GROUP_CONSTANTS.HEARTBEAT_INTERVAL;
```

### 2. Toujours aligner avec le SSOT

Si vous modifiez les seuils d'activité :
1. **D'abord** : Modifier `get_user_active_groups()` dans PostgreSQL
2. **Ensuite** : Adapter `groupConstants.ts`
3. **Enfin** : Mettre à jour cette documentation

### 3. Vérifier la cohérence après modification

Après toute modification de seuils temporels, exécuter :

```bash
# Tests unitaires
npm test src/__tests__/constants.test.ts

# Tests SQL de cohérence
psql -f supabase/tests/ssot_coherence.sql
```

## 📚 Fichiers liés

### Frontend
- `src/constants/groupConstants.ts` - Toutes les constantes temporelles
- `src/services/unifiedGroupService.ts` - `isUserConnected()`
- `src/hooks/useUnifiedGroups.ts` - Heartbeat et refetch
- `src/hooks/useActivityHeartbeat.ts` - Envoi des heartbeats

### Backend (PostgreSQL)
- `get_user_active_groups()` - SSOT pour participations actives
- `is_user_connected_realtime()` - SSOT pour connexion temps réel
- `dissolve_old_groups()` - Nettoyage automatique
- `check_user_participation_limit()` - Vérification limites

### Cron
- `supabase/config.toml` - Configuration du cron cleanup (6h)

## 🎉 Bénéfices de cette architecture

1. **Cohérence absolue** : Une seule définition de "connecté", "actif", "valide"
2. **Maintenabilité** : Modifications centralisées dans le SSOT PostgreSQL
3. **Performance** : Pas de nettoyage redondant côté frontend
4. **Fiabilité** : Élimination des bugs de désynchronisation
5. **Documentation** : Constantes et seuils clairement documentés

---

**Dernière mise à jour** : Octobre 2025  
**Version** : 1.0.0 (Post-harmonisation SSOT)
