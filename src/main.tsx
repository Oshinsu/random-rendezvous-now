
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { IntelligentCleanupService } from './services/intelligentCleanupService';
import { NotificationService } from './services/notificationService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// 🚀 DÉMARRAGE DES SERVICES INTELLIGENTS
// Service initialization

// Service de nettoyage intelligent
IntelligentCleanupService.startPeriodicIntelligentCleanup();

// Service de notifications (demande permission au premier usage)
NotificationService.initialize().then(enabled => {
  // Notifications status
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
