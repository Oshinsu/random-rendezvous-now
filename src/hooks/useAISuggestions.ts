import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AISuggestion {
  name: string;
  subject: string;
  objective: string;
  timing: string;
  hook: string;
}

export const useAISuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [segmentName, setSegmentName] = useState<string>('');

  const fetchSuggestions = async (segmentKey: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('campaign-ai-suggestions', {
        body: { segment_key: segmentKey }
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
      setSegmentName(data.segment_name);

      toast.success('✨ Suggestions générées', {
        description: `${data.suggestions.length} campagnes créatives pour ${data.segment_name}`
      });

      return data;
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      toast.error('Erreur', {
        description: 'Impossible de générer les suggestions IA'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    suggestions,
    segmentName,
    fetchSuggestions
  };
};