
// CONSTANTES INTELLIGENTES - Plan de nettoyage optimisé
export const GROUP_CONSTANTS = {
  // === PROTECTION DES GROUPES VIVANTS ===
  // Temps considéré comme "connecté en temps réel"
  CONNECTION_THRESHOLD: 5 * 60 * 1000, // 5 minutes - vraiment connecté
  
  // Temps pour groupes "en formation active" (protection totale)
  ACTIVE_GROUP_PROTECTION: 30 * 60 * 1000, // 30 minutes - protection totale
  
  // Temps d'attente maximum pour formation de groupe
  GROUP_FORMATION_TIMEOUT: 60 * 60 * 1000, // 1 HEURE - délai d'attente réaliste
  
  // === NETTOYAGE INTELLIGENT ===
  // Participants considérés comme "abandonnés"
  PARTICIPANT_ABANDONED_THRESHOLD: 6 * 60 * 60 * 1000, // 6 heures pour abandon
  
  // Groupes très anciens - nettoyage final
  VERY_OLD_GROUP_THRESHOLD: 24 * 60 * 60 * 1000, // 24 heures pour nettoyage final
  
  // === RÉTROCOMPATIBILITÉ ===
  PARTICIPANT_ACTIVITY_THRESHOLD: 6 * 60 * 60 * 1000, // Compatible avec logique existante
  MAX_GROUP_AGE_FOR_JOIN: 60 * 60 * 1000, // 1 heure maximum pour rejoindre
  PARTICIPANT_INACTIVE_THRESHOLD: 6 * 60 * 60 * 1000, // Alias pour compatibilité
  PERIODIC_CLEANUP_THRESHOLD: 12 * 60 * 60 * 1000, // Alias pour compatibilité
  
  // Nettoyage périodique - plus fréquent mais intelligent
  CLEANUP_FREQUENCY: 30 * 60 * 1000, // 30 minutes - fréquence pour détecter rapidement
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
