import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBatchActions = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const exportSelected = async () => {
    setIsProcessing(true);
    try {
      // Fetch selected users data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', selectedIds);

      if (error) throw error;

      // Convert to CSV
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString()}.csv`;
      a.click();

      toast.success('Export successful', {
        description: `Exported ${selectedIds.length} users`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: 'Could not export users'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const suspendSelected = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement suspension logic with admin action
      toast.info('Feature coming soon', {
        description: 'User suspension will be available soon'
      });
      clearSelection();
    } catch (error) {
      console.error('Suspend error:', error);
      toast.error('Suspend failed', {
        description: 'Could not suspend users'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    selectedIds,
    isProcessing,
    toggleSelection,
    selectAll,
    clearSelection,
    exportSelected,
    suspendSelected,
  };
};
