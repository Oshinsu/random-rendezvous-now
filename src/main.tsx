
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
// 🧹 NETTOYAGE UNIFIÉ
// Le nettoyage est maintenant géré uniquement par cleanup-groups Edge Function


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
