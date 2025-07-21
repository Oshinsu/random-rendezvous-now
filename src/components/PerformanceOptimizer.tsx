
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
    
    const measurePerformance = () => {
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
      
      // Envoyer les métriques aux analytics
      track('performance_metrics', newMetrics);
    };

    // Mesurer après que le composant soit monté
    setTimeout(measurePerformance, 100);
    
    // Observer les changements de performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          track('navigation_timing', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart
          });
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['navigation', 'measure'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
    
    return () => {
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
