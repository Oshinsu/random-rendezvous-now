import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  metadata?: any;
  created_at: string;
  admin_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const useAdminAudit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async (filters?: { actionType?: string; tableName?: string; adminUserId?: string }) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin_profile:profiles!admin_audit_log_admin_user_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters?.tableName) {
        query = query.eq('table_name', filters.tableName);
      }

      if (filters?.adminUserId) {
        query = query.eq('admin_user_id', filters.adminUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAuditLogs(data as AuditLogEntry[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription to audit logs
  useEffect(() => {
    fetchAuditLogs();

    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_audit_log'
        },
        () => {
          // Refresh audit logs when new entries are added
          fetchAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { auditLogs, loading, error, fetchAuditLogs };
};