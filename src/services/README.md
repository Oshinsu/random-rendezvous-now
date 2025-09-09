# Architecture Services - Version Finale Optimisée

## Services Principaux (4 Services Spécialisés)

### 🤖 IntelligentCleanupService
- **Rôle** : SEUL service de nettoyage automatique
- **Intervalle** : 30 minutes
- **Fonctionnalités** : Protection des groupes vivants, nettoyage intelligent

### 🔧 UnifiedGroupService 
- **Rôle** : Service principal consolidé pour toutes les opérations de groupe
- **Fonctionnalités** : Participations, membres, création/adhésion groupes, synchronisation

### 📍 GroupGeolocationService
- **Rôle** : Recherche géographique de groupes compatibles
- **Fonctionnalités** : Algorithmes de proximité, filtrage par disponibilité

### ⏰ UnifiedScheduledGroupService
- **Rôle** : Gestion des groupes programmés
- **Fonctionnalités** : Planification, activation différée

### Services de Base Maintenus

#### GroupService
- **Rôle** : Utilitaires de base pour le nettoyage ponctuel et comptage
- **Note** : Service allégé, doublons supprimés

#### Services Supprimés Définitivement
- ~~SimpleGroupService~~ : Supprimé (doublon à 95% avec UnifiedGroupService - 431 lignes)
- ~~OptimizedCleanupService~~ : Supprimé (race conditions)
- ~~PeriodicCleanupService~~ : Supprimé (redondant)
- ~~UnifiedCleanupService~~ : Supprimé (conflits)
- ~~TempGroupService~~ : Intégré dans UnifiedGroupService

### Constantes Harmonisées
- `CONNECTION_THRESHOLD` : 10 minutes (plus patient)
- `HEARTBEAT_INTERVAL` : 10 minutes (réduit le stress serveur)
- `GROUP_REFETCH_INTERVAL` : 2 minutes (moins de stress)
- `GROUP_STALE_TIME` : 90 secondes (plus patient)
- `PARTICIPANT_ABANDONED_THRESHOLD` : 2 heures (aligné)

### Changements DB
- Triggers automatiques de nettoyage supprimés
- `dissolve_old_groups()` marquée comme DEPRECATED
- Fonction `handle_group_participant_changes` ne fait plus de nettoyage automatique
- `transition_groups_to_completed` plus patient (45min au lieu de 30min)

### Résultat Attendu
- Fin des race conditions entre services multiples
- Réduction significative de la charge serveur
- Harmonisation des seuils temporels
- Un seul point de contrôle pour le nettoyage

## Résultat de l'Éradication des Doublons

### ✅ Architecture Finale Streamlinée
- **4 services principaux spécialisés** (au lieu de 6+)
- **~1100 lignes de code dupliqué supprimées**
- **Fonctionnalités consolidées** dans UnifiedGroupService
- **Logique IDF centralisée** avec `getGroupLocation()`

### 🎯 Points Clés
- **Pas de redondance** : Chaque service a un rôle unique
- **Maintenance simplifiée** : Code consolidé et organisé
- **Performance améliorée** : Moins de services concurrents
- **Démarrage automatique** : IntelligentCleanupService s'initialise dans main.tsx

### 🚀 Utilisation
L'architecture est maintenant entièrement autonome. Aucun service de nettoyage supplémentaire ne doit être ajouté.