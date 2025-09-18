# Architecture Services - Version Finale Optimisée

## Services Principaux (3 Services Spécialisés)

### 🔧 UnifiedGroupService 
- **Rôle** : Service principal consolidé pour toutes les opérations de groupe
- **Fonctionnalités** : Participations, membres, création/adhésion groupes, synchronisation

### 📍 GroupGeolocationService
- **Rôle** : Recherche géographique de groupes compatibles
- **Fonctionnalités** : Algorithmes de proximité, filtrage par disponibilité

### ⏰ UnifiedScheduledGroupService
- **Rôle** : Gestion des groupes programmés
- **Fonctionnalités** : Planification, activation différée

## Nettoyage Automatique

### 🧹 cleanup-groups Edge Function
- **Rôle** : SEUL système de nettoyage automatique
- **Déclencheur** : Cron job quotidien à 4h du matin
- **Fonctionnalités** : 
  - Appelle `dissolve_old_groups()` PostgreSQL function
  - Transition des groupes confirmés vers complétés
  - Activation des groupes planifiés
  - Réparation de l'historique des sorties
  - Nettoyage sécurisé avec rétention de 7 jours

### Services de Base Maintenus

#### GroupService
- **Rôle** : Utilitaires de base pour le nettoyage ponctuel et comptage
- **Note** : Service allégé, doublons supprimés

#### Services Supprimés Définitivement
- ~~IntelligentCleanupService~~ : N'existait que dans les commentaires
- ~~SimpleGroupService~~ : Supprimé (doublon à 95% avec UnifiedGroupService)
- ~~OptimizedCleanupService~~ : Supprimé (race conditions)
- ~~PeriodicCleanupService~~ : Supprimé (redondant)
- ~~UnifiedCleanupService~~ : Supprimé (conflits)
- ~~TempGroupService~~ : Intégré dans UnifiedGroupService

### Constantes Harmonisées
- `CONNECTION_THRESHOLD` : 10 minutes (plus patient)
- `HEARTBEAT_INTERVAL` : 1 heure (optimisé pour la stabilité)
- `GROUP_REFETCH_INTERVAL` : 2 minutes (moins de stress)
- `GROUP_STALE_TIME` : 90 secondes (plus patient)
- `PARTICIPANT_ABANDONED_THRESHOLD` : 6 heures (aligné avec cleanup)

### Architecture Finale
- **Nettoyage serveur uniquement** : Edge function + PostgreSQL function
- **Pas de nettoyage côté client** : Évite les race conditions
- **Rétention conservative** : 7 jours pendant la phase d'adoption
- **Protection des groupes planifiés** : Supprimés 1 jour après scheduled_for

## Résultat de l'Éradication des Doublons

### ✅ Architecture Finale Streamlinée
- **3 services principaux spécialisés** (au lieu de 6+)
- **~1100 lignes de code dupliqué supprimées**
- **Fonctionnalités consolidées** dans UnifiedGroupService
- **Logique IDF centralisée** avec `getGroupLocation()`

### 🎯 Points Clés
- **Pas de redondance** : Chaque service a un rôle unique
- **Maintenance simplifiée** : Code consolidé et organisé
- **Performance améliorée** : Moins de services concurrents
- **Nettoyage serveur seulement** : Fiable et sans race conditions

### 🚀 Utilisation
L'architecture est maintenant entièrement autonome. Le nettoyage est géré automatiquement par la edge function `cleanup-groups`.