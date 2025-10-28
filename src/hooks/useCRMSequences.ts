import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CampaignSequence {
  id: string;
  sequence_name: string;
  target_segment_id?: string;
  trigger_type: 'manual' | 'lifecycle' | 'segment' | 'behavior';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  segment?: {
    segment_name: string;
  };
  steps?: SequenceStep[];
}

interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  campaign_id?: string;
  delay_hours: number;
  condition: any;
  created_at: string;
  campaign?: {
    campaign_name: string;
  };
}

export const useCRMSequences = () => {
  const [sequences, setSequences] = useState<CampaignSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('crm_campaign_sequences')
        .select(`
          *,
          segment:crm_user_segments(segment_name),
          steps:crm_campaign_sequence_steps(
            *,
            campaign:crm_campaigns(campaign_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Sort steps within each sequence
      const sequencesWithSortedSteps = (data || []).map(seq => ({
        ...seq,
        steps: (seq.steps || []).sort((a: any, b: any) => a.step_order - b.step_order)
      }));

      setSequences(sequencesWithSortedSteps as CampaignSequence[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching sequences:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createSequence = async (sequenceData: {
    sequence_name: string;
    target_segment_id?: string;
    trigger_type: string;
    steps: Array<{ campaign_id: string; delay_hours: number }>;
  }) => {
    try {
      // Create sequence
      const { data: sequence, error: seqError } = await supabase
        .from('crm_campaign_sequences')
        .insert({
          sequence_name: sequenceData.sequence_name,
          target_segment_id: sequenceData.target_segment_id,
          trigger_type: sequenceData.trigger_type,
          is_active: true
        })
        .select()
        .single();

      if (seqError) throw seqError;

      // Create steps
      const steps = sequenceData.steps.map((step, index) => ({
        sequence_id: sequence.id,
        step_order: index + 1,
        campaign_id: step.campaign_id,
        delay_hours: step.delay_hours
      }));

      const { error: stepsError } = await supabase
        .from('crm_campaign_sequence_steps')
        .insert(steps);

      if (stepsError) throw stepsError;

      toast({
        title: 'Séquence créée',
        description: 'La séquence de campagne a été créée avec succès'
      });

      await fetchSequences();
      return sequence;
    } catch (err) {
      console.error('Error creating sequence:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la séquence',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const toggleSequenceStatus = async (sequenceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('crm_campaign_sequences')
        .update({ is_active: isActive })
        .eq('id', sequenceId);

      if (error) throw error;

      toast({
        title: isActive ? 'Séquence activée' : 'Séquence désactivée',
        description: 'Le statut de la séquence a été mis à jour'
      });

      await fetchSequences();
    } catch (err) {
      console.error('Error toggling sequence status:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const deleteSequence = async (sequenceId: string) => {
    try {
      const { error } = await supabase
        .from('crm_campaign_sequences')
        .delete()
        .eq('id', sequenceId);

      if (error) throw error;

      toast({
        title: 'Séquence supprimée',
        description: 'La séquence a été supprimée avec succès'
      });

      await fetchSequences();
    } catch (err) {
      console.error('Error deleting sequence:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la séquence',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const executeSequence = async (sequenceId: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('execute-sequence', {
        body: { sequence_id: sequenceId, user_id: userId }
      });

      if (error) throw error;

      toast({
        title: 'Séquence lancée',
        description: `${data.steps_scheduled} étapes programmées`
      });

      return data;
    } catch (err) {
      console.error('Error executing sequence:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de lancer la séquence',
        variant: 'destructive'
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  return {
    sequences,
    loading,
    error,
    refetch: fetchSequences,
    createSequence,
    toggleSequenceStatus,
    deleteSequence,
    executeSequence
  };
};