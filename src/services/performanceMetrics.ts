/**
 * Performance Metrics Service
 * Provides comprehensive performance tracking and analytics for the application
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  cacheHit?: boolean;
  userId?: string;
  groupId?: string;
  error?: string;
}

export interface PerformanceAnalytics {
  averageDuration: number;
  successRate: number;
  cacheHitRate: number;
  totalOperations: number;
  failureCount: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
}

export class PerformanceMetricsService {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 1000; // Prevent memory leaks
  private static readonly SLOW_OPERATION_THRESHOLD = 2000; // 2 seconds

  // Start tracking an operation
  static startOperation(operation: string, context?: { userId?: string; groupId?: string }) {
    const start = performance.now();
    const timestamp = Date.now();
    
    return {
      end: (success = true, error?: string, cacheHit = false) => {
        const duration = performance.now() - start;
        
        const metric: PerformanceMetric = {
          operation,
          duration,
          timestamp,
          success,
          cacheHit,
          userId: context?.userId,
          groupId: context?.groupId,
          error: error || undefined
        };
        
        this.addMetric(metric);
        this.logMetric(metric);
        
        return metric;
      }
    };
  }

  // Add a metric to the collection
  private static addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Maintain maximum size
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Log metric with appropriate level
  private static logMetric(metric: PerformanceMetric): void {
    const { operation, duration, success, cacheHit, error } = metric;
    const durationStr = duration.toFixed(2);
    const cacheStr = cacheHit ? ' (cache hit)' : '';
    
    if (!success) {
      console.error(`🔴 [PERF] ${operation}: ${durationStr}ms FAILED${cacheStr}`, error);
    } else if (duration > this.SLOW_OPERATION_THRESHOLD) {
      console.warn(`🟡 [PERF] ${operation}: ${durationStr}ms SLOW${cacheStr}`);
    } else {
      console.log(`🟢 [PERF] ${operation}: ${durationStr}ms${cacheStr}`);
    }
  }

  // Get all metrics
  static getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics for specific operation
  static getMetricsForOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  // Get metrics for specific user
  static getMetricsForUser(userId: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.userId === userId);
  }

  // Get analytics for all operations
  static getAnalytics(): PerformanceAnalytics {
    if (this.metrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        cacheHitRate: 0,
        totalOperations: 0,
        failureCount: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = this.metrics.filter(m => m.success).length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const failures = this.metrics.filter(m => !m.success);
    
    const sortedByDuration = [...this.metrics].sort((a, b) => a.duration - b.duration);

    return {
      averageDuration: totalDuration / this.metrics.length,
      successRate: (successCount / this.metrics.length) * 100,
      cacheHitRate: (cacheHits / this.metrics.length) * 100,
      totalOperations: this.metrics.length,
      failureCount: failures.length,
      slowestOperation: sortedByDuration[sortedByDuration.length - 1] || null,
      fastestOperation: sortedByDuration[0] || null
    };
  }

  // Get analytics for specific operation
  static getOperationAnalytics(operation: string): PerformanceAnalytics {
    const operationMetrics = this.getMetricsForOperation(operation);
    
    if (operationMetrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        cacheHitRate: 0,
        totalOperations: 0,
        failureCount: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = operationMetrics.filter(m => m.success).length;
    const cacheHits = operationMetrics.filter(m => m.cacheHit).length;
    const failures = operationMetrics.filter(m => !m.success);
    
    const sortedByDuration = [...operationMetrics].sort((a, b) => a.duration - b.duration);

    return {
      averageDuration: totalDuration / operationMetrics.length,
      successRate: (successCount / operationMetrics.length) * 100,
      cacheHitRate: (cacheHits / operationMetrics.length) * 100,
      totalOperations: operationMetrics.length,
      failureCount: failures.length,
      slowestOperation: sortedByDuration[sortedByDuration.length - 1] || null,
      fastestOperation: sortedByDuration[0] || null
    };
  }

  // Get slow operations (above threshold)
  static getSlowOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > this.SLOW_OPERATION_THRESHOLD);
  }

  // Get failed operations
  static getFailedOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => !m.success);
  }

  // Get cache efficiency
  static getCacheEfficiency(): { totalRequests: number; cacheHits: number; hitRate: number } {
    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    
    return {
      totalRequests,
      cacheHits,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0
    };
  }

  // Generate performance report
  static generateReport(): string {
    const analytics = this.getAnalytics();
    const cacheEfficiency = this.getCacheEfficiency();
    const slowOps = this.getSlowOperations();
    const failedOps = this.getFailedOperations();

    const report = `
📊 PERFORMANCE REPORT
====================
Total Operations: ${analytics.totalOperations}
Average Duration: ${analytics.averageDuration.toFixed(2)}ms
Success Rate: ${analytics.successRate.toFixed(1)}%
Cache Hit Rate: ${analytics.cacheHitRate.toFixed(1)}%

🚀 FASTEST OPERATION
${analytics.fastestOperation ? 
  `${analytics.fastestOperation.operation}: ${analytics.fastestOperation.duration.toFixed(2)}ms` : 
  'N/A'}

🐌 SLOWEST OPERATION
${analytics.slowestOperation ? 
  `${analytics.slowestOperation.operation}: ${analytics.slowestOperation.duration.toFixed(2)}ms` : 
  'N/A'}

⚠️  SLOW OPERATIONS (>${this.SLOW_OPERATION_THRESHOLD}ms)
${slowOps.length === 0 ? 'None' : slowOps.map(op => 
  `${op.operation}: ${op.duration.toFixed(2)}ms`).join('\n')}

❌ FAILED OPERATIONS
${failedOps.length === 0 ? 'None' : failedOps.map(op => 
  `${op.operation}: ${op.error || 'Unknown error'}`).join('\n')}

💾 CACHE EFFICIENCY
Hit Rate: ${cacheEfficiency.hitRate.toFixed(1)}%
Total Requests: ${cacheEfficiency.totalRequests}
Cache Hits: ${cacheEfficiency.cacheHits}
    `.trim();

    return report;
  }

  // Clear all metrics
  static clearMetrics(): void {
    this.metrics = [];
    console.log('📊 Performance metrics cleared');
  }

  // Export metrics as JSON
  static exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      analytics: this.getAnalytics(),
      cacheEfficiency: this.getCacheEfficiency(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Get operation summary
  static getOperationSummary(): Record<string, { count: number; avgDuration: number; successRate: number }> {
    const summary: Record<string, { count: number; avgDuration: number; successRate: number }> = {};
    
    // Group metrics by operation
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.operation]) {
        acc[metric.operation] = [];
      }
      acc[metric.operation].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // Calculate summary for each operation
    Object.entries(groupedMetrics).forEach(([operation, metrics]) => {
      const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
      const successCount = metrics.filter(m => m.success).length;
      
      summary[operation] = {
        count: metrics.length,
        avgDuration: totalDuration / metrics.length,
        successRate: (successCount / metrics.length) * 100
      };
    });

    return summary;
  }
}