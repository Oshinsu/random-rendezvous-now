import { useState, useEffect } from 'react';

/**
 * Hook centralisé pour gérer l'état de la permission push
 * Vérifie à la fois localStorage ET le navigateur pour éviter les race conditions
 */
export const usePushPermissionState = () => {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    const checkPermissionState = () => {
      // ✅ NOUVELLE LOGIQUE SIMPLIFIÉE
      const hasAskedBefore = localStorage.getItem('push_permission_asked') === 'true';
      const hasGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
      const hasDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';

      // Ne montrer que si:
      // 1. Pas encore demandé (localStorage)
      // 2. Pas déjà granted
      // 3. Pas denied (sinon on spam l'user)
      const shouldShow = !hasAskedBefore && !hasGranted && !hasDenied;
      
      setShouldShowModal(shouldShow);
    };

    checkPermissionState();
  }, []);

  const markAsAsked = () => {
    localStorage.setItem('push_permission_asked', 'true');
    setShouldShowModal(false);
  };

  return {
    shouldShowModal,
    markAsAsked,
  };
};
