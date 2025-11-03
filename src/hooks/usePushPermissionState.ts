import { useState, useEffect } from 'react';

/**
 * Hook centralisé pour gérer l'état de la permission push
 * Vérifie à la fois localStorage ET le navigateur pour éviter les race conditions
 */
export const usePushPermissionState = () => {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    const checkPermissionState = () => {
      // Vérifier localStorage
      const permissionAsked = localStorage.getItem('push_permission_asked');
      
      // Vérifier le navigateur directement
      const browserPermission = typeof Notification !== 'undefined' 
        ? Notification.permission 
        : 'default';

      // Ne pas montrer si:
      // 1. Permission déjà demandée (localStorage)
      // 2. Permission déjà accordée dans le navigateur
      const shouldShow = permissionAsked !== 'true' && browserPermission !== 'granted';
      
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
