
// Constantes CORRIGÉES pour résoudre les problèmes de groupes zombies
export const GROUP_CONSTANTS = {
  // NOUVELLES CONSTANTES - Seuils d'activité RENFORCÉS
  PARTICIPANT_ACTIVITY_THRESHOLD: 2 * 60 * 60 * 1000, // 2 heures - seuil pour participant "actif"
  MAX_GROUP_AGE_FOR_JOIN: 3 * 60 * 60 * 1000, // 3 heures - âge max pour rejoindre un groupe
  CONNECTION_THRESHOLD: 10 * 60 * 1000, // 10 minutes - statut "connecté" en temps réel
  
  // RÉTROCOMPATIBILITÉ - Alias pour les anciens noms
  PARTICIPANT_INACTIVE_THRESHOLD: 2 * 60 * 60 * 1000, // Alias pour PARTICIPANT_ACTIVITY_THRESHOLD
  PERIODIC_CLEANUP_THRESHOLD: 12 * 60 * 60 * 1000, // Alias pour compatibilité
  
  // Nettoyage périodique
  CLEANUP_FREQUENCY: 2 * 60 * 60 * 1000, // 2 heures - fréquence de nettoyage automatique
  HEARTBEAT_INTERVAL: 30 * 1000, // 30 secondes - battement de cœur d'activité
  
  // Paramètres de groupe INCHANGÉS
  MAX_PARTICIPANTS: 5,
  SEARCH_RADIUS: 10000, // 10km en mètres
  
  // Intervalles de rafraîchissement OPTIMISÉS pour détecter changements rapidement
  GROUP_REFETCH_INTERVAL: 30000, // 30 secondes (plus rapide)
  GROUP_STALE_TIME: 15000, // 15 secondes (plus réactif)
  
  // Seuils de nettoyage AGRESSIFS pour éliminer les groupes zombies
  CLEANUP_THRESHOLDS: {
    // Participants inactifs depuis 2 heures (au lieu de 6h)
    INACTIVE_PARTICIPANTS: 2 * 60 * 60 * 1000,
    
    // Groupes en attente anciens depuis 1 heure (au lieu de 12h)
    OLD_WAITING_GROUPS: 1 * 60 * 60 * 1000,
    
    // Groupes terminés après 3 heures (au lieu de 6h)
    COMPLETED_GROUPS: 3 * 60 * 60 * 1000,
    
    // Groupes très anciens après 12 heures (au lieu de 48h)
    VERY_OLD_GROUPS: 12 * 60 * 60 * 1000,
    
    // NOUVEAU: Groupes vides depuis 30 minutes
    EMPTY_GROUPS: 30 * 60 * 1000,
  },
  
  // Constantes pour rejoindre des groupes existants
  GROUP_JOIN: {
    // Seuil minimum de participants dans un groupe pour considérer le rejoindre
    MIN_PARTICIPANTS_TO_JOIN: 1,
    
    // Âge maximum d'un groupe pour le considérer viable (2 heures)
    MAX_GROUP_AGE: 2 * 60 * 60 * 1000,
  }
};
