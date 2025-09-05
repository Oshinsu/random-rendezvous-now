
// CONSTANTES HARMONISÉES - IntelligentCleanupService UNIQUEMENT
export const GROUP_CONSTANTS = {
  // === PROTECTION DES GROUPES VIVANTS ===
  // Temps considéré comme "connecté en temps réel" - AUGMENTÉ pour réduire le stress
  CONNECTION_THRESHOLD: 10 * 60 * 1000, // 10 minutes - vraiment connecté (plus patient)
  
  // Temps pour groupes "en formation active" (protection totale)
  ACTIVE_GROUP_PROTECTION: 30 * 60 * 1000, // 30 minutes - protection totale
  
  // Temps d'attente maximum pour formation de groupe
  GROUP_FORMATION_TIMEOUT: 60 * 60 * 1000, // 1 HEURE - délai d'attente réaliste
  
  // === NETTOYAGE INTELLIGENT UNIFIÉ ===
  // Participants considérés comme "abandonnés" - RÉDUIT pour harmoniser
  PARTICIPANT_ABANDONED_THRESHOLD: 2 * 60 * 60 * 1000, // 2 heures pour abandon (réduit)
  
  // Groupes très anciens - nettoyage final - RÉDUIT pour harmoniser
  VERY_OLD_GROUP_THRESHOLD: 12 * 60 * 60 * 1000, // 12 heures pour nettoyage final (réduit)
  
  // === HARMONISATION DES SEUILS ===
  PARTICIPANT_ACTIVITY_THRESHOLD: 30 * 60 * 1000, // 30 minutes (réaliste)
  MAX_GROUP_AGE_FOR_JOIN: 8 * 60 * 60 * 1000, // 8 heures maximum pour rejoindre
  PARTICIPANT_INACTIVE_THRESHOLD: 30 * 60 * 1000, // 30 minutes (réaliste)
  PERIODIC_CLEANUP_THRESHOLD: 12 * 60 * 60 * 1000, // Désactivé mais alias conservé
  
  // Nettoyage INTELLIGENT UNIQUEMENT - Fréquence réduite pour réduire le stress
  CLEANUP_FREQUENCY: 30 * 60 * 1000, // 30 minutes - IntelligentCleanupService uniquement
  HEARTBEAT_INTERVAL: 10 * 60 * 1000, // 10 minutes - battement de cœur moins fréquent
  
  // Paramètres de groupe INCHANGÉS
  MAX_PARTICIPANTS: 5,
  SEARCH_RADIUS: 25000, // 25km en mètres
  
  // Intervalles de rafraîchissement OPTIMISÉS pour réduire la charge serveur
  GROUP_REFETCH_INTERVAL: 2 * 60 * 1000, // 2 minutes (moins de stress)
  GROUP_STALE_TIME: 90 * 1000, // 90 secondes (plus patient)
  
  // Seuils de nettoyage HARMONISÉS pour IntelligentCleanupService UNIQUEMENT
  CLEANUP_THRESHOLDS: {
    // Participants inactifs alignés avec PARTICIPANT_ABANDONED_THRESHOLD
    INACTIVE_PARTICIPANTS: 2 * 60 * 60 * 1000,
    
    // Groupes en attente avec plus de patience
    OLD_WAITING_GROUPS: 45 * 60 * 1000, // 45 minutes (plus patient)
    
    // Groupes terminés - standard
    COMPLETED_GROUPS: 6 * 60 * 60 * 1000, // Retour à 6h (plus patient)
    
    // Groupes très anciens alignés avec VERY_OLD_GROUP_THRESHOLD
    VERY_OLD_GROUPS: 12 * 60 * 60 * 1000,
    
    // Groupes vides avec plus de patience
    EMPTY_GROUPS: 10 * 60 * 1000, // 10 minutes (plus patient)
  },
  
  // Constantes pour rejoindre des groupes existants
  GROUP_JOIN: {
    // Seuil minimum de participants dans un groupe pour considérer le rejoindre
    MIN_PARTICIPANTS_TO_JOIN: 1,
    
    // Âge maximum d'un groupe pour le considérer viable (2 heures)
    MAX_GROUP_AGE: 2 * 60 * 60 * 1000,
  }
};
