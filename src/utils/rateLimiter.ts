
// Basic client-side rate limiting utility

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  blockedUntil?: number;
}

export class RateLimiter {
  private static storage = new Map<string, RateLimitState>();

  // Check if an action is rate limited
  static isRateLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const state = this.storage.get(key);

    // If no state exists, create it
    if (!state) {
      this.storage.set(key, {
        attempts: 1,
        windowStart: now
      });
      return false;
    }

    // Check if currently blocked
    if (state.blockedUntil && now < state.blockedUntil) {
      console.warn(`🚫 Rate limited: ${key} blocked until ${new Date(state.blockedUntil).toISOString()}`);
      return true;
    }

    // Check if we need to reset the window
    if (now - state.windowStart > config.windowMs) {
      state.attempts = 1;
      state.windowStart = now;
      state.blockedUntil = undefined;
      return false;
    }

    // Increment attempts
    state.attempts++;

    // Check if limit exceeded
    if (state.attempts > config.maxAttempts) {
      const blockDuration = config.blockDurationMs || config.windowMs * 2;
      state.blockedUntil = now + blockDuration;
      
      console.warn(`🚫 Rate limit exceeded for ${key}. Blocked for ${blockDuration}ms`);
      return true;
    }

    return false;
  }

  // Reset rate limit for a key
  static reset(key: string): void {
    this.storage.delete(key);
  }

  // Clean up old entries
  static cleanup(): void {
    const now = Date.now();
    
    for (const [key, state] of this.storage.entries()) {
      // Remove entries older than 1 hour
      if (now - state.windowStart > 3600000) {
        this.storage.delete(key);
      }
    }
  }

  // Get rate limit status
  static getStatus(key: string): { attempts: number; remainingTime: number; isBlocked: boolean } {
    const state = this.storage.get(key);
    const now = Date.now();

    if (!state) {
      return { attempts: 0, remainingTime: 0, isBlocked: false };
    }

    const isBlocked = state.blockedUntil ? now < state.blockedUntil : false;
    const remainingTime = isBlocked ? state.blockedUntil! - now : 0;

    return {
      attempts: state.attempts,
      remainingTime,
      isBlocked
    };
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  GROUP_CREATION: {
    maxAttempts: 3,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes
  },
  GROUP_JOIN: {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 180000 // 3 minutes
  },
  MESSAGE_SENDING: {
    maxAttempts: 20,
    windowMs: 60000, // 1 minute
    blockDurationMs: 60000 // 1 minute
  },
  GEOLOCATION: {
    maxAttempts: 200,
    windowMs: 600000, // 10 minutes
    blockDurationMs: 30000 // 30 secondes seulement
  }
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  RateLimiter.cleanup();
}, 300000);
