
// Centralized group management constants
export const GROUP_CONSTANTS = {
  // Inactivity thresholds (in milliseconds) - MUCH MORE LENIENT
  PARTICIPANT_INACTIVE_THRESHOLD: 24 * 60 * 60 * 1000, // 24 hours - for client-side filtering only
  PERIODIC_CLEANUP_THRESHOLD: 48 * 60 * 60 * 1000, // 48 hours - for actual cleanup
  CONNECTION_THRESHOLD: 60 * 60 * 1000, // 1 hour - for "connected" status display
  
  // Activity heartbeat settings - MORE FREQUENT
  HEARTBEAT_INTERVAL: 20 * 1000, // 20 seconds - how often to update last_seen
  
  // Group settings
  MAX_PARTICIPANTS: 5,
  SEARCH_RADIUS: 10000, // 10km in meters
  
  // Refresh intervals - MORE FREQUENT
  GROUP_REFETCH_INTERVAL: 30000, // 30 seconds
  GROUP_STALE_TIME: 15000, // 15 seconds
};
