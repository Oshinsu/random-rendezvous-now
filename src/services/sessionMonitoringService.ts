import { supabase } from '@/integrations/supabase/client';

export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  spuriousLogouts: number;
  sessionRecoveries: number;
  avgSessionDuration: number;
  criticalOperationFailures: number;
}

export interface SessionEvent {
  id: string;
  userId: string;
  eventType: 'login' | 'logout' | 'spurious_logout' | 'recovery_attempt' | 'recovery_success' | 'critical_operation_start' | 'critical_operation_end' | 'critical_operation_failure';
  timestamp: number;
  metadata: Record<string, any>;
}

/**
 * Service for monitoring user sessions and detecting authentication issues
 * Helps track and prevent the bug where users are logged out after clicking "Find Group"
 */
export class SessionMonitoringService {
  private static sessionEvents: SessionEvent[] = [];
  private static metrics: SessionMetrics = {
    totalSessions: 0,
    activeSessions: 0,
    spuriousLogouts: 0,
    sessionRecoveries: 0,
    avgSessionDuration: 0,
    criticalOperationFailures: 0
  };

  /**
   * Track a session event
   */
  static trackEvent(
    userId: string,
    eventType: SessionEvent['eventType'],
    metadata: Record<string, any> = {}
  ): void {
    const event: SessionEvent = {
      id: crypto.randomUUID(),
      userId,
      eventType,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.sessionEvents.push(event);
    this.updateMetrics(event);

    // Enhanced logging for debugging
    console.log(`📊 [SESSION MONITORING] Event tracked:`, {
      type: eventType,
      userId: userId.slice(0, 8),
      timestamp: new Date(event.timestamp).toISOString(),
      metadata: event.metadata
    });

    // Keep only last 1000 events to prevent memory issues
    if (this.sessionEvents.length > 1000) {
      this.sessionEvents = this.sessionEvents.slice(-1000);
    }

    // Check for patterns that might indicate issues
    this.detectAnomalies(userId, eventType);
  }

  /**
   * Update metrics based on new event
   */
  private static updateMetrics(event: SessionEvent): void {
    switch (event.eventType) {
      case 'login':
        this.metrics.totalSessions++;
        this.metrics.activeSessions++;
        break;
      case 'logout':
        this.metrics.activeSessions = Math.max(0, this.metrics.activeSessions - 1);
        break;
      case 'spurious_logout':
        this.metrics.spuriousLogouts++;
        this.metrics.activeSessions = Math.max(0, this.metrics.activeSessions - 1);
        break;
      case 'recovery_success':
        this.metrics.sessionRecoveries++;
        this.metrics.activeSessions++;
        break;
      case 'critical_operation_failure':
        this.metrics.criticalOperationFailures++;
        break;
    }
  }

  /**
   * Detect anomalies in session behavior
   */
  private static detectAnomalies(userId: string, eventType: SessionEvent['eventType']): void {
    const userEvents = this.sessionEvents
      .filter(e => e.userId === userId)
      .slice(-20); // Last 20 events for this user

    // Detect rapid logout/login cycles
    if (eventType === 'spurious_logout') {
      const recentSpuriousLogouts = userEvents
        .filter(e => e.eventType === 'spurious_logout')
        .filter(e => Date.now() - e.timestamp < 300000); // Last 5 minutes

      if (recentSpuriousLogouts.length >= 3) {
        console.warn('🚨 [SESSION MONITORING] Multiple spurious logouts detected for user', {
          userId: userId.slice(0, 8),
          count: recentSpuriousLogouts.length,
          timespan: '5 minutes'
        });

        // This could trigger an alert or automatic intervention
        this.handleCriticalSessionIssue(userId, 'multiple_spurious_logouts');
      }
    }

    // Detect failed critical operations
    if (eventType === 'critical_operation_failure') {
      const recentFailures = userEvents
        .filter(e => e.eventType === 'critical_operation_failure')
        .filter(e => Date.now() - e.timestamp < 600000); // Last 10 minutes

      if (recentFailures.length >= 2) {
        console.warn('🚨 [SESSION MONITORING] Multiple critical operation failures detected', {
          userId: userId.slice(0, 8),
          count: recentFailures.length,
          timespan: '10 minutes'
        });

        this.handleCriticalSessionIssue(userId, 'repeated_critical_failures');
      }
    }
  }

  /**
   * Handle critical session issues
   */
  private static handleCriticalSessionIssue(userId: string, issueType: string): void {
    console.error('🚨 [SESSION MONITORING] Critical session issue detected', {
      userId: userId.slice(0, 8),
      issueType,
      timestamp: new Date().toISOString()
    });

    // Could implement automatic session refresh or user notification here
    // For now, we just log and potentially prepare for manual intervention
  }

  /**
   * Get current session metrics
   */
  static getMetrics(): SessionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent events for debugging
   */
  static getRecentEvents(userId?: string, limit: number = 50): SessionEvent[] {
    let events = this.sessionEvents;
    
    if (userId) {
      events = events.filter(e => e.userId === userId);
    }

    return events
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generate a session health report
   */
  static generateHealthReport(userId?: string): {
    metrics: SessionMetrics;
    recentEvents: SessionEvent[];
    healthScore: number;
    recommendations: string[];
  } {
    const events = this.getRecentEvents(userId, 100);
    const metrics = this.getMetrics();
    
    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Penalize for spurious logouts
    if (metrics.spuriousLogouts > 0) {
      healthScore -= Math.min(metrics.spuriousLogouts * 10, 50);
    }
    
    // Penalize for critical operation failures
    if (metrics.criticalOperationFailures > 0) {
      healthScore -= Math.min(metrics.criticalOperationFailures * 15, 40);
    }
    
    // Bonus for successful recoveries
    if (metrics.sessionRecoveries > 0) {
      healthScore += Math.min(metrics.sessionRecoveries * 5, 20);
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (metrics.spuriousLogouts > 2) {
      recommendations.push('High number of spurious logouts detected - investigate authentication flow');
    }
    
    if (metrics.criticalOperationFailures > 1) {
      recommendations.push('Critical operation failures detected - check group creation flow');
    }
    
    if (healthScore < 70) {
      recommendations.push('Session health is below optimal - consider implementing additional session protection');
    }

    return {
      metrics,
      recentEvents: events,
      healthScore,
      recommendations
    };
  }

  /**
   * Clear old events and reset metrics (for maintenance)
   */
  static reset(): void {
    this.sessionEvents = [];
    this.metrics = {
      totalSessions: 0,
      activeSessions: 0,
      spuriousLogouts: 0,
      sessionRecoveries: 0,
      avgSessionDuration: 0,
      criticalOperationFailures: 0
    };
    
    console.log('📊 [SESSION MONITORING] Metrics and events reset');
  }

  /**
   * Start monitoring session health
   */
  static startMonitoring(): void {
    console.log('📊 [SESSION MONITORING] Starting session health monitoring');

    // Monitor authentication state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        switch (event) {
          case 'SIGNED_IN':
            this.trackEvent(session.user.id, 'login', { event });
            break;
          case 'SIGNED_OUT':
            this.trackEvent(session.user.id, 'logout', { event });
            break;
        }
      }
    });

    // Periodic health checks
    setInterval(() => {
      const report = this.generateHealthReport();
      
      if (report.healthScore < 50) {
        console.warn('🚨 [SESSION MONITORING] Session health critical', {
          healthScore: report.healthScore,
          recommendations: report.recommendations
        });
      }
    }, 300000); // Every 5 minutes
  }
}
