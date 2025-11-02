import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  target_segments: string[];
  created_at: string;
  updated_at: string;
}

export const useFeatureFlags = () => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabledFlags, setEnabledFlags] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('feature_flags' as any)
        .select('*')
        .order('flag_name');

      if (error) throw error;

      setFlags((data || []) as unknown as FeatureFlag[]);
      
      // Determine which flags are enabled for this user
      const enabled = new Set<string>();
      (data as any[] || []).forEach((flag: any) => {
        if (isFeatureEnabled(flag)) {
          enabled.add(flag.flag_key);
        }
      });
      setEnabledFlags(enabled);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (flag: FeatureFlag): boolean => {
    if (!flag.enabled) return false;
    
    // 100% rollout
    if (flag.rollout_percentage === 100) return true;
    
    // 0% rollout
    if (flag.rollout_percentage === 0) return false;
    
    // Percentage-based rollout (use user ID for deterministic hash)
    if (user) {
      const hash = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const userPercentile = hash % 100;
      return userPercentile < flag.rollout_percentage;
    }
    
    return false;
  };

  const checkFlag = (flagKey: string): boolean => {
    return enabledFlags.has(flagKey);
  };

  const updateFlag = async (flagId: string, updates: Partial<FeatureFlag>) => {
    try {
      const { error } = await supabase
        .from('feature_flags' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', flagId);

      if (error) throw error;
      
      await fetchFlags();
      return true;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return false;
    }
  };

  const createFlag = async (flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('feature_flags' as any)
        .insert(flag as any);

      if (error) throw error;
      
      await fetchFlags();
      return true;
    } catch (error) {
      console.error('Error creating feature flag:', error);
      return false;
    }
  };

  const deleteFlag = async (flagId: string) => {
    try {
      const { error } = await supabase
        .from('feature_flags' as any)
        .delete()
        .eq('id', flagId);

      if (error) throw error;
      
      await fetchFlags();
      return true;
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      return false;
    }
  };

  return {
    flags,
    loading,
    checkFlag,
    updateFlag,
    createFlag,
    deleteFlag,
    refresh: fetchFlags,
  };
};
