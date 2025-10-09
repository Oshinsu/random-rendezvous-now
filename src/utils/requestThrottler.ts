// Global Supabase request throttler with circuit breaker

interface RequestState {
  lastRequest: number;
  requestCount: number;
  blocked: boolean;
  blockedUntil?: number;
}

class RequestThrottler {
  private static requests = new Map<string, RequestState>();
  private static readonly WINDOW_MS = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 100; // Max 100 requests per minute
  private static readonly BLOCK_DURATION_MS = 60000; // Block for 1 minute

  static canMakeRequest(key: string): boolean {
    const now = Date.now();
    const state = this.requests.get(key);

    if (!state) {
      this.requests.set(key, {
        lastRequest: now,
        requestCount: 1,
        blocked: false,
      });
      return true;
    }

    // Check if blocked
    if (state.blocked && state.blockedUntil) {
      if (now < state.blockedUntil) {
        console.warn(`🚫 Request blocked for ${key}. Wait ${Math.ceil((state.blockedUntil - now) / 1000)}s`);
        return false;
      }
      // Unblock
      state.blocked = false;
      state.blockedUntil = undefined;
      state.requestCount = 0;
    }

    // Reset window if expired
    if (now - state.lastRequest > this.WINDOW_MS) {
      state.requestCount = 1;
      state.lastRequest = now;
      return true;
    }

    // Increment count
    state.requestCount++;

    // Check if exceeds limit
    if (state.requestCount > this.MAX_REQUESTS) {
      state.blocked = true;
      state.blockedUntil = now + this.BLOCK_DURATION_MS;
      console.error(`🚨 Circuit breaker activated for ${key}! Too many requests (${state.requestCount})`);
      return false;
    }

    return true;
  }

  static getStatus(key: string) {
    const state = this.requests.get(key);
    if (!state) return { requestCount: 0, blocked: false, remainingTime: 0 };

    const now = Date.now();
    return {
      requestCount: state.requestCount,
      blocked: state.blocked,
      remainingTime: state.blockedUntil ? Math.max(0, state.blockedUntil - now) : 0,
    };
  }

  static reset(key: string) {
    this.requests.delete(key);
  }

  static cleanup() {
    const now = Date.now();
    for (const [key, state] of this.requests.entries()) {
      if (now - state.lastRequest > this.WINDOW_MS * 2) {
        this.requests.delete(key);
      }
    }
  }
}

// Cleanup old entries every 5 minutes
setInterval(() => RequestThrottler.cleanup(), 5 * 60 * 1000);

export { RequestThrottler };
