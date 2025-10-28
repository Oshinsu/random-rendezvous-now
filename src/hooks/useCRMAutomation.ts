import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  rule_name: string;
  trigger_type: string;
  trigger_condition: any;
  campaign_id?: string | null;
  delay_minutes: number;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  campaign?: {
    campaign_name: string;
  } | null;
}

export const useCRMAutomation = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('crm_automation_rules')
        .select(`
          *,
          campaign:crm_campaigns(campaign_name)
        `)
        .order('priority', { ascending: false });

      if (fetchError) throw fetchError;

      setRules(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching automation rules:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData: any) => {
    try {
      const { data, error: createError } = await supabase
        .from('crm_automation_rules')
        .insert([ruleData])
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Règle créée',
        description: 'La règle d\'automation a été créée avec succès'
      });

      await fetchRules();
      return data;
    } catch (err) {
      console.error('Error creating automation rule:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la règle',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('crm_automation_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: isActive ? 'Règle activée' : 'Règle désactivée',
        description: 'Le statut a été mis à jour'
      });

      await fetchRules();
    } catch (err) {
      console.error('Error toggling rule status:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('crm_automation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Règle supprimée',
        description: 'La règle d\'automation a été supprimée'
      });

      await fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la règle',
        variant: 'destructive'
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return { 
    rules, 
    loading, 
    error, 
    refetch: fetchRules,
    createRule,
    toggleRuleStatus,
    deleteRule
  };
};