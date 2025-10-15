
// CONSTANTES HARMONISÉES - Cleanup géré par dissolve_old_groups() edge function
export const GROUP_CONSTANTS = {
  // === PROTECTION DES GROUPES VIVANTS ===
  // Temps considéré comme "connecté en temps réel" - AUGMENTÉ pour réduire le stress
  CONNECTION_THRESHOLD: 10 * 60 * 1000, // 10 minutes - vraiment connecté (plus patient)
  
  // Temps pour groupes "en formation active" (protection totale)
  ACTIVE_GROUP_PROTECTION: 30 * 60 * 1000, // 30 minutes - protection totale
  
  // Temps d'attente maximum pour formation de groupe
  GROUP_FORMATION_TIMEOUT: 60 * 60 * 1000, // 1 HEURE - délai d'attente réaliste
  
  // === NETTOYAGE INTELLIGENT UNIFIÉ - ALIGNÉ AVEC SSOT ===
  // ⚠️ IMPORTANT : Ces seuils DOIVENT correspondre aux constantes dans
  // la fonction PostgreSQL get_user_active_groups() :
  // - activity_threshold = '24 hours'
  // - group_age_limit = '7 days'
  
  // Participants considérés comme "actifs" - ALIGNÉ AVEC SSOT
  PARTICIPANT_ACTIVITY_THRESHOLD: 24 * 60 * 60 * 1000, // 24 heures - SSOT
  PARTICIPANT_ABANDONED_THRESHOLD: 24 * 60 * 60 * 1000, // 24 heures - aligné SSOT
  
  // Groupes très anciens - nettoyage final - ALIGNÉ AVEC SSOT
  VERY_OLD_GROUP_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // 7 jours - aligné SSOT
  MAX_GROUP_AGE_FOR_JOIN: 7 * 24 * 60 * 60 * 1000, // 7 jours - aligné SSOT
  
  // Seuil pour "inactif" (frontend display) - ALIGNÉ avec HEARTBEAT
  PARTICIPANT_INACTIVE_THRESHOLD: 60 * 60 * 1000, // 1 heure (aligné heartbeat)
  PERIODIC_CLEANUP_THRESHOLD: 6 * 60 * 60 * 1000, // 6 heures - aligné avec cron
  
  // Nettoyage géré par cleanup-groups edge function (toutes les 6 heures)
  CLEANUP_FREQUENCY: 6 * 60 * 60 * 1000, // 6 heures - edge function toutes les 6h (cron: 0 */6 * * *)
  HEARTBEAT_INTERVAL: 60 * 60 * 1000, // 1 heure - aligné avec is_user_connected_realtime()
  
  // Paramètres de groupe INCHANGÉS
  MAX_PARTICIPANTS: 5,
  SEARCH_RADIUS: 25000, // 25km en mètres - Utiliser getSearchRadius() pour la valeur dynamique
  
  // Intervalles de rafraîchissement OPTIMISÉS pour réduire la charge serveur
  GROUP_REFETCH_INTERVAL: 2 * 60 * 1000, // 2 minutes (moins de stress)
  GROUP_STALE_TIME: 90 * 1000, // 90 secondes (plus patient)
  
  // Seuils de nettoyage pour dissolve_old_groups() function - ALIGNÉS AVEC SSOT
  CLEANUP_THRESHOLDS: {
    // Participants inactifs - ALIGNÉ AVEC SSOT (24h)
    INACTIVE_PARTICIPANTS: 24 * 60 * 60 * 1000, // 24h - aligné SSOT
    
    // Groupes en attente - ALIGNÉ AVEC SSOT (7 jours)
    OLD_WAITING_GROUPS: 7 * 24 * 60 * 60 * 1000, // 7 jours - aligné SSOT
    
    // Groupes terminés - Conservation courte (3 jours pour historique)
    COMPLETED_GROUPS: 3 * 24 * 60 * 60 * 1000, // 3 jours - pour historique
    
    // Groupes très anciens - ALIGNÉ AVEC SSOT (7 jours)
    VERY_OLD_GROUPS: 7 * 24 * 60 * 60 * 1000, // 7 jours - aligné SSOT
    
    // Groupes vides - Nettoyage rapide
    EMPTY_GROUPS: 10 * 60 * 1000, // 10 minutes
  },
  
  // === FRÉQUENCES DE RAFRAÎCHISSEMENT ===
  REFRESH_INTERVALS: {
    HEARTBEAT: 60 * 60 * 1000,           // 1 heure - updateUserLastSeen
    GROUP_REFETCH: 5 * 60 * 1000,        // 5 minutes - React Query
    GROUP_STALE_TIME: 2 * 60 * 1000,     // 2 minutes - React Query
    CLEANUP_CRON: 6 * 60 * 60 * 1000,    // 6 heures - Supabase cron
  } as const,
  
  // Constantes pour rejoindre des groupes existants
  GROUP_JOIN: {
    // Seuil minimum de participants dans un groupe pour considérer le rejoindre
    MIN_PARTICIPANTS_TO_JOIN: 1,
    
    // Âge maximum d'un groupe pour le considérer viable (6 heures)
    MAX_GROUP_AGE: 6 * 60 * 60 * 1000,
  }
};
