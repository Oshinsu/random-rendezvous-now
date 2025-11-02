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
      
      // Fetch audit logs first
      let query = supabase
        .from('admin_audit_log')
        .select('*')
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

      const { data: auditData, error: auditError } = await query;
      if (auditError) throw auditError;

      if (!auditData) {
        setAuditLogs([]);
        return;
      }

      // Get unique admin user IDs
      const adminUserIds = [...new Set(auditData.map(log => log.admin_user_id))];

      // Fetch admin profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', adminUserIds);

      // Combine data
      const enrichedLogs = auditData.map(log => ({
        ...log,
        admin_profile: profiles?.find(p => p.id === log.admin_user_id) || null
      }));

      setAuditLogs(enrichedLogs as AuditLogEntry[]);
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

    // Unique channel name to prevent duplicate subscriptions
    const channelName = `audit-logs-changes-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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
      // ✅ SOTA 2025: unsubscribe avant removeChannel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return { auditLogs, loading, error, fetchAuditLogs };
};