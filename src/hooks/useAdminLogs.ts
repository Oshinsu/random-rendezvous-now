import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      // Create mock logs based on real system activity but simplified for now
      // In a real implementation, you would use Supabase analytics
      const mockSystemLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 5000).toISOString(),
          level: 'info',
          source: 'auth',
          message: 'Utilisateur connecté avec succès',
          metadata: { userId: 'user123', ip: '192.168.1.1' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 15000).toISOString(),
          level: 'warn',
          source: 'groups',
          message: 'Tentative de création de groupe avec coordonnées invalides',
          metadata: { lat: 'invalid', lng: 'invalid' }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'error',
          source: 'google-places',
          message: 'Erreur API Google Places - Limite de quota atteinte',
          metadata: { errorCode: 'OVER_QUERY_LIMIT', endpoint: '/places/search' }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 45000).toISOString(),
          level: 'info',
          source: 'cleanup',
          message: 'Nettoyage automatique terminé',
          metadata: { deletedGroups: 5, deletedParticipants: 12 }
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'info',
          source: 'database',
          message: 'Connexion base de données établie',
          metadata: { connectionPool: '5/10' }
        }
      ];

      // Add some real data from recent groups/participants
      const { data: recentGroups } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: recentParticipants } = await supabase
        .from('group_participants')
        .select('*')
        .order('joined_at', { ascending: false })
        .limit(5);

      // Convert real data to log format
      recentGroups?.forEach(group => {
        if (group.status === 'confirmed') {
          mockSystemLogs.push({
            id: `group_${group.id}`,
            timestamp: group.created_at,
            level: 'info',
            source: 'groups',
            message: `Groupe confirmé avec ${group.current_participants} participants`,
            metadata: { 
              groupId: group.id, 
              location: group.location_name,
              barName: group.bar_name 
            }
          });
        }
      });

      recentParticipants?.forEach(participant => {
        mockSystemLogs.push({
          id: `participant_${participant.id}`,
          timestamp: participant.joined_at,
          level: 'info',
          source: 'participants',
          message: 'Nouvel utilisateur rejoint un groupe',
          metadata: { 
            participantId: participant.id,
            groupId: participant.group_id 
          }
        });
      });

      // Sort by timestamp (newest first)
      mockSystemLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(mockSystemLogs.slice(0, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des logs');
      console.error('Error fetching logs:', err);
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