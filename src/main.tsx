
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/article-typography.css'; // ✅ SOTA 2025 Typography
import './i18n';
// 🧹 NETTOYAGE UNIFIÉ
// Le nettoyage est maintenant géré uniquement par cleanup-groups Edge Function

// Register Service Workers (both caching and push notifications)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Image caching service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ SW registration failed:', error);
      });
    
    // Firebase messaging service worker for push notifications
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Firebase SW registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Firebase SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <App />
    </Suspense>
  </StrictMode>,
);
