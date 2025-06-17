
// Centralized group management constants
export const GROUP_CONSTANTS = {
  // Inactivity thresholds (in milliseconds)
  PARTICIPANT_INACTIVE_THRESHOLD: 3 * 60 * 60 * 1000, // 3 hours
  PERIODIC_CLEANUP_THRESHOLD: 6 * 60 * 60 * 1000, // 6 hours
  
  // Group settings
  MAX_PARTICIPANTS: 5,
  SEARCH_RADIUS: 10000, // 10km in meters
  
  // Refresh intervals
  GROUP_REFETCH_INTERVAL: 60000, // 1 minute
  GROUP_STALE_TIME: 30000, // 30 seconds
};
