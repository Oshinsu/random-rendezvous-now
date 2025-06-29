
// Constantes centralisées et CORRIGÉES pour la gestion des groupes
export const GROUP_CONSTANTS = {
  // Seuils d'inactivité HARMONISÉS (en millisecondes)
  PARTICIPANT_INACTIVE_THRESHOLD: 3 * 60 * 60 * 1000, // 3 heures - filtrage côté client uniquement
  PERIODIC_CLEANUP_THRESHOLD: 48 * 60 * 60 * 1000, // 48 heures - nettoyage réel DB
  CONNECTION_THRESHOLD: 60 * 60 * 1000, // 1 heure - statut "connecté"
  
  // Battement de cœur d'activité OPTIMISÉ
  HEARTBEAT_INTERVAL: 30 * 1000, // 30 secondes - fréquence de mise à jour last_seen
  
  // Paramètres de groupe
  MAX_PARTICIPANTS: 5,
  SEARCH_RADIUS: 10000, // 10km en mètres
  
  // Intervalles de rafraîchissement OPTIMISÉS
  GROUP_REFETCH_INTERVAL: 45000, // 45 secondes
  GROUP_STALE_TIME: 30000, // 30 secondes
  
  // Nouveaux seuils de nettoyage UNIFIÉS
  CLEANUP_THRESHOLDS: {
    INACTIVE_PARTICIPANTS: 6 * 60 * 60 * 1000, // 6 heures
    OLD_WAITING_GROUPS: 12 * 60 * 60 * 1000, // 12 heures
    COMPLETED_GROUPS: 6 * 60 * 60 * 1000, // 6 heures après meeting_time
    VERY_OLD_GROUPS: 48 * 60 * 60 * 1000, // 48 heures (dernière chance)
  }
};
