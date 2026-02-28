import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlogSchedule {
  id: string;
  is_active: boolean;
  frequency_days: number;
  last_generation_at: string | null;
  next_generation_at: string | null;
  total_generated: number;
  updated_at: string;
}

export const useBlogGeneration = () => {
  const queryClient = useQueryClient();

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['blog-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_generation_schedule')
        .select('*')
        .single();

      if (error) throw error;
      return data as BlogSchedule;
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async (updates: Partial<BlogSchedule>) => {
      const { data, error } = await supabase
        .from('blog_generation_schedule')
        .update(updates)
        .eq('id', schedule!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-schedule'] });
      toast.success('Planification mise à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const generateNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-seo-article');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      queryClient.invalidateQueries({ queryKey: ['blog-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['blog-keywords'] });
      
      if (data.success) {
        toast.success(`Article "${data.article.title}" généré avec succès ! (Score SEO: ${data.article.seo_score}/100)`);
      }
    },
    onError: (error: any) => {
      toast.error(`Erreur de génération: ${error.message}`);
    },
  });

  return {
    schedule,
    isLoading,
    updateSchedule,
    generateNow,
  };
};
