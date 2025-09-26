
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
// 🧹 NETTOYAGE UNIFIÉ
// Le nettoyage est maintenant géré uniquement par cleanup-groups Edge Function


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <App />
    </Suspense>
  </StrictMode>,
);
