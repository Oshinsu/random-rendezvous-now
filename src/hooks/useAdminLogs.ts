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
      const realLogs: LogEntry[] = [];

      // Add some real data from recent groups/participants  
      const { data: recentGroups } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      const { data: recentParticipants } = await supabase
        .from('group_participants')
        .select('*')
        .order('joined_at', { ascending: false })
        .limit(10);

      const { data: recentMessages } = await supabase
        .from('group_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: apiLogs } = await supabase
        .from('api_requests_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      // Convert API logs to log format
      apiLogs?.forEach(log => {
        realLogs.push({
          id: `api_${log.id}`,
          timestamp: log.created_at || new Date().toISOString(),
          level: log.status_code && log.status_code >= 400 ? 'error' : 'info',
          source: log.api_name || 'api',
          message: `${log.request_type} ${log.endpoint} - ${log.status_code}`,
          metadata: { 
            responseTime: log.response_time_ms,
            cost: log.cost_usd,
            error: log.error_message
          }
        });
      });

      // Convert groups to log format
      recentGroups?.forEach(group => {
        realLogs.push({
          id: `group_${group.id}`,
          timestamp: group.created_at,
          level: group.status === 'completed' ? 'info' : 'debug',
          source: 'groups',
          message: `Groupe ${group.status} avec ${group.current_participants} participants`,
          metadata: { 
            groupId: group.id, 
            location: group.location_name,
            barName: group.bar_name 
          }
        });
      });

      // Convert participants to log format
      recentParticipants?.forEach(participant => {
        realLogs.push({
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

      // Convert messages to log format
      recentMessages?.forEach(message => {
        if (message.is_system) {
          realLogs.push({
            id: `message_${message.id}`,
            timestamp: message.created_at,
            level: 'debug',
            source: 'system',
            message: message.message || 'Message système',
            metadata: { 
              groupId: message.group_id
            }
          });
        }
      });

      // Sort by timestamp (newest first)
      realLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(realLogs.slice(0, 50));
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