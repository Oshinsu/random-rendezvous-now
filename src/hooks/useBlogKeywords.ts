import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlogKeyword {
  id: string;
  keyword: string;
  priority: number;
  status: 'active' | 'paused' | 'archived';
  last_used_at: string | null;
  times_used: number;
  created_at: string;
  created_by: string | null;
  notes: string | null;
}

export const useBlogKeywords = () => {
  const queryClient = useQueryClient();

  const { data: keywords, isLoading } = useQuery({
    queryKey: ['blog-keywords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_keywords')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogKeyword[];
    },
  });

  const addKeyword = useMutation({
    mutationFn: async (newKeyword: { keyword: string; priority: number; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('blog_keywords')
        .insert({
          ...newKeyword,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-keywords'] });
      toast.success('Mot-clé ajouté avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateKeyword = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BlogKeyword> }) => {
      const { data, error } = await supabase
        .from('blog_keywords')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-keywords'] });
      toast.success('Mot-clé mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteKeyword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-keywords'] });
      toast.success('Mot-clé supprimé');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    keywords,
    isLoading,
    addKeyword,
    updateKeyword,
    deleteKeyword,
  };
};
