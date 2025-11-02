import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StructuredLog {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  user_id: string | null;
  group_id: string | null;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
}

interface LogFilters {
  level?: string;
  event?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export const useStructuredLogs = (filters?: LogFilters) => {
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('structured_logs' as any)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.event) {
        query = query.ilike('event', `%${filters.event}%`);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setLogs((data || []) as unknown as StructuredLog[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching structured logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const logEvent = async (
    level: StructuredLog['level'],
    event: string,
    metadata: Record<string, any> = {},
    tags: string[] = [],
    userId?: string,
    groupId?: string
  ) => {
    try {
      const { error } = await supabase.rpc('log_structured_event' as any, {
        p_level: level,
        p_event: event,
        p_user_id: userId || null,
        p_group_id: groupId || null,
        p_metadata: metadata,
        p_tags: tags,
      } as any);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging event:', error);
      return false;
    }
  };

  const getEventCounts = () => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      counts[log.event] = (counts[log.event] || 0) + 1;
    });
    return counts;
  };

  const getLevelCounts = () => {
    const counts = { debug: 0, info: 0, warn: 0, error: 0 };
    logs.forEach(log => {
      counts[log.level]++;
    });
    return counts;
  };

  return {
    logs,
    loading,
    totalCount,
    logEvent,
    getEventCounts,
    getLevelCounts,
    refresh: fetchLogs,
  };
};
