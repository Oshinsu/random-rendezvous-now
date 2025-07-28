import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const useErrorTracking = () => {
  const { track } = useAnalytics();

  useEffect(() => {
    // Track unhandled errors
    const handleError = (event: ErrorEvent) => {
      track('application_error', {
        error_message: event.message,
        error_filename: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
        error_stack: event.error?.stack,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      track('application_error', {
        error_type: 'unhandled_promise_rejection',
        error_reason: event.reason?.toString(),
        error_stack: event.reason?.stack,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    };

    // Track React errors (basic implementation)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('React') || args[0]?.includes?.('Warning')) {
        track('react_error', {
          error_message: args.join(' '),
          timestamp: new Date().toISOString()
        });
      }
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, [track]);

  const trackManualError = (error: Error, context?: string) => {
    track('manual_error', {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      timestamp: new Date().toISOString()
    });
  };

  return { trackManualError };
};