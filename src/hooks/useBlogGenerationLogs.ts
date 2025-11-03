import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BlogGenerationLog {
  id: string;
  status: 'started' | 'success' | 'error';
  keyword_id: string | null;
  keyword: string | null;
  article_id: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  word_count: number | null;
  seo_score: number | null;
  tokens_used: number | null;
  generation_time_ms: number | null;
  created_at: string;
}

export const useBlogGenerationLogs = () => {
  return useQuery({
    queryKey: ['blog-generation-logs'],
    queryFn: async (): Promise<BlogGenerationLog[]> => {
      const { data, error } = await supabase
        .from('blog_generation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as BlogGenerationLog[];
    },
    refetchInterval: 30000, // Refresh every 30s
  });
};

export const useBlogGenerationStats = () => {
  return useQuery({
    queryKey: ['blog-generation-stats'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('blog_generation_logs')
        .select('status, seo_score, generation_time_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const total = logs?.length || 0;
      const successes = logs?.filter(l => l.status === 'success').length || 0;
      const errors = logs?.filter(l => l.status === 'error').length || 0;
      const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;

      const avgScore = logs && logs.length > 0
        ? Math.round(
            logs
              .filter(l => l.seo_score != null)
              .reduce((sum, l) => sum + (l.seo_score || 0), 0) / 
            logs.filter(l => l.seo_score != null).length
          )
        : 0;

      const avgTime = logs && logs.length > 0
        ? Math.round(
            logs
              .filter(l => l.generation_time_ms != null)
              .reduce((sum, l) => sum + (l.generation_time_ms || 0), 0) / 
            logs.filter(l => l.generation_time_ms != null).length
          )
        : 0;

      // Last 7 days activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLogs = logs?.filter(l => new Date(l.created_at) > sevenDaysAgo) || [];

      return {
        total,
        successes,
        errors,
        successRate,
        avgScore,
        avgTime,
        recentActivity: recentLogs.length,
      };
    },
    refetchInterval: 30000,
  });
};
