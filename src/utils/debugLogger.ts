// Debug logger for monitoring automatic refetches and excessive requests

interface LogEntry {
  timestamp: number;
  type: 'refetch' | 'request' | 'subscription';
  source: string;
  details?: any;
}

class DebugLogger {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 1000;
  private static readonly ALERT_THRESHOLD = 10; // Alert if more than 10 requests per minute

  static log(type: LogEntry['type'], source: string, details?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      type,
      source,
      details,
    };

    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Check for excessive requests
    this.checkExcessiveRequests(source);

    // Console log in development
    if (import.meta.env.DEV) {
      console.log(`📊 [${type.toUpperCase()}] ${source}`, details || '');
    }
  }

  private static checkExcessiveRequests(source: string) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentRequests = this.logs.filter(
      (log) => log.source === source && log.timestamp > oneMinuteAgo
    );

    if (recentRequests.length > this.ALERT_THRESHOLD) {
      console.warn(
        `⚠️ EXCESSIVE REQUESTS DETECTED: ${source} has made ${recentRequests.length} requests in the last minute!`
      );
    }
  }

  static getStats(source?: string) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;

    let relevantLogs = this.logs;
    if (source) {
      relevantLogs = this.logs.filter((log) => log.source === source);
    }

    return {
      total: relevantLogs.length,
      lastMinute: relevantLogs.filter((log) => log.timestamp > oneMinuteAgo).length,
      lastFiveMinutes: relevantLogs.filter((log) => log.timestamp > fiveMinutesAgo).length,
      byType: {
        refetch: relevantLogs.filter((log) => log.type === 'refetch').length,
        request: relevantLogs.filter((log) => log.type === 'request').length,
        subscription: relevantLogs.filter((log) => log.type === 'subscription').length,
      },
    };
  }

  static getLogs(source?: string, limit: number = 50) {
    let logs = [...this.logs].reverse();
    if (source) {
      logs = logs.filter((log) => log.source === source);
    }
    return logs.slice(0, limit);
  }

  static clear() {
    this.logs = [];
  }
}

// Make it available globally in development
if (import.meta.env.DEV) {
  (window as any).debugLogger = DebugLogger;
}

export { DebugLogger };
