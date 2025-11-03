import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISuggestion {
  improved_text: string;
  reasoning: string;
  seo_score: number;
  tone_match?: 'perfect' | 'good' | 'needs_work';
  suggestions?: string[];
}

interface ImproveTextParams {
  text: string;
  context: 'hero' | 'benefits' | 'how_it_works' | 'footer' | 'meta';
  goal: string;
}

export const useCMSAICopywriter = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISuggestion | null>(null);

  const improveText = async (params: ImproveTextParams): Promise<AISuggestion> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-ai-copywriter', {
        body: {
          action: 'improve',
          text: params.text,
          section_context: params.context,
          goal: params.goal
        }
      });

      if (error) throw error;
      
      setResult(data);
      return data;
    } catch (err) {
      console.error('AI Copywriter error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateABVariants = async (text: string): Promise<any[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-ai-copywriter', {
        body: {
          action: 'ab_test',
          text: text
        }
      });

      if (error) throw error;
      
      return data.variants || [];
    } catch (err) {
      console.error('AB Variants error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    improveText,
    generateABVariants,
    loading,
    result
  };
};
