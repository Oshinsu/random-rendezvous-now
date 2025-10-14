import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlogArticle {
  id: string;
  keyword_id: string | null;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  status: 'draft' | 'published' | 'archived';
  seo_score: number | null;
  views_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  generated_by_ai: boolean;
}

export const useBlogArticles = (status?: 'draft' | 'published' | 'archived') => {
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['blog-articles', status],
    queryFn: async () => {
      let query = supabase
        .from('blog_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      } else {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogArticle[];
    },
  });

  const getArticleBySlug = async (slug: string) => {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;

    // Incrémenter les vues
    await supabase.rpc('increment_article_views', { article_id: data.id });

    return data as BlogArticle;
  };

  const updateArticle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BlogArticle> }) => {
      const { data, error } = await supabase
        .from('blog_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      toast.success('Article mis à jour');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const publishArticle = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('blog_articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      toast.success('Article publié !');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] });
      toast.success('Article supprimé');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    articles,
    isLoading,
    getArticleBySlug,
    updateArticle,
    publishArticle,
    deleteArticle,
  };
};
