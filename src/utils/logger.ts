// Production-safe logger for Random app
// Logs only in development, silent in production

const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, data || '');
    }
  },
  
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.info(`ℹ️ ${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error || '');
  },
  
  realtime: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🛰️ ${message}`, data || '');
    }
  }
};
