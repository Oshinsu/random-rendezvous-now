// Clean logging utility to reduce console spam in production
const isDevelopment = import.meta.env.DEV;

export const logger = {
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    // Always log errors, but cleanly
    console.error(`❌ ${message}`, error || '');
  },
  
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`🔍 ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`, data || '');
    }
  }
};