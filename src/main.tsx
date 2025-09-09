
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { IntelligentCleanupService } from './services/intelligentCleanupService';

// 🚀 DÉMARRAGE DES SERVICES INTELLIGENTS
// TEMPORARILY DISABLED - Service de nettoyage désactivé pour éviter la suppression massive
// IntelligentCleanupService.startPeriodicIntelligentCleanup();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
