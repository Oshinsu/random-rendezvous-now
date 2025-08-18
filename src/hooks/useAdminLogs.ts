import { useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  source: string;
  message: string;
  metadata?: any;
}

export const useAdminLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simuler des logs système
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 5000).toISOString(),
          level: 'info',
          source: 'auth.service',
          message: 'Utilisateur connecté avec succès',
          metadata: { userId: 'user123', ip: '192.168.1.1' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 15000).toISOString(),
          level: 'warn',
          source: 'group.service',
          message: 'Tentative de création de groupe avec coordonnées invalides',
          metadata: { lat: 'invalid', lng: 'invalid' }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'error',
          source: 'places.api',
          message: 'Erreur API Google Places - Limite de quota atteinte',
          metadata: { errorCode: 'OVER_QUERY_LIMIT', endpoint: '/places/search' }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 45000).toISOString(),
          level: 'info',
          source: 'cleanup.service',
          message: 'Nettoyage automatique terminé',
          metadata: { deletedGroups: 5, deletedParticipants: 12 }
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'debug',
          source: 'database',
          message: 'Requête exécutée avec succès',
          metadata: { query: 'SELECT * FROM groups WHERE status = ?', duration: '45ms' }
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'warn',
          source: 'auth.middleware',
          message: 'Token d\'authentification expiré',
          metadata: { token: 'eyJ...', userId: 'user456' }
        },
        {
          id: '7',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'error',
          source: 'edge.function',
          message: 'Échec de l\'assignation automatique de bar',
          metadata: { groupId: 'group789', reason: 'No bars found in radius' }
        },
        {
          id: '8',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'info',
          source: 'notification.service',
          message: 'Notification envoyée avec succès',
          metadata: { type: 'group_confirmed', recipients: 5 }
        }
      ];

      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setLogs(mockLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return {
    logs,
    loading,
    error,
    fetchLogs
  };
};