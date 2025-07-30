# Services de Nettoyage - Architecture Simplifiée

## État Actuel (Post-Résolution)

### Service Unique Actif
- **IntelligentCleanupService** : SEUL service de nettoyage automatique
  - Intervalle : 30 minutes
  - Logique de protection des groupes vivants
  - Nettoyage coordonné et intelligent

### Services Supprimés
- ~~OptimizedCleanupService~~ : Supprimé (causes de race conditions)
- ~~PeriodicCleanupService~~ : Supprimé (redondant)
- ~~UnifiedCleanupService~~ : Supprimé (conflits avec IntelligentCleanupService)

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

## Utilisation

L'IntelligentCleanupService est automatiquement initialisé par EnhancedGroupService.initialize() et fonctionne de manière autonome.

Aucun autre service de nettoyage ne doit être activé ou utilisé.