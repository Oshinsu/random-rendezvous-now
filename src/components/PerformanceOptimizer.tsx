
import { memo, useEffect, useState, ReactNode } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PerformanceOptimizerProps {
  children: ReactNode;
}

// Hook pour surveiller les performances
export const usePerformanceMonitor = () => {
  const { track } = useAnalytics();
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    // Mesurer le temps de chargement initial
    const startTime = performance.now();
    let lastMetricTime = 0;
    const METRIC_THROTTLE_MS = 30000; // Send metrics every 30 seconds max
    
    const measurePerformance = () => {
      const now = Date.now();
      if (now - lastMetricTime < METRIC_THROTTLE_MS) {
        return; // Throttle metrics to avoid flooding
      }
      
      lastMetricTime = now;
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Mesurer l'utilisation mémoire si disponible
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      const newMetrics = {
        loadTime,
        renderTime: endTime,
        memoryUsage: memoryUsage / 1024 / 1024 // Convert to MB
      };
      
      setMetrics(newMetrics);
      
      // Envoyer les métriques aux analytics (throttled)
      track('performance_metrics', newMetrics);
    };

    // Mesurer après que le composant soit monté (one time only)
    const initialTimeout = setTimeout(measurePerformance, 1000);
    
    // Observer les changements de performance (throttled)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          // Only track navigation timing once per session
          const hasTrackedNavigation = sessionStorage.getItem('navigation_tracked');
          if (!hasTrackedNavigation) {
            track('navigation_timing', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              session_id: Date.now().toString()
            });
            sessionStorage.setItem('navigation_tracked', 'true');
          }
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
    
    return () => {
      clearTimeout(initialTimeout);
      observer.disconnect();
    };
  }, [track]);

  return metrics;
};

// Component wrapper pour optimiser les rendus
const PerformanceOptimizer = memo(({ children }: PerformanceOptimizerProps) => {
  usePerformanceMonitor();
  
  return <>{children}</>;
});

PerformanceOptimizer.displayName = 'PerformanceOptimizer';

export default PerformanceOptimizer;
