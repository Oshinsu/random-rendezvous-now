import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SEOScore {
  id: string;
  content_id: string;
  readability_score: number;
  keyword_density: number;
  length_score: number;
  cta_score: number;
  emoji_score: number;
  total_score: number;
  suggestions: string[];
  calculated_at: string;
  section?: string;
}

interface CMSSEOScores {
  scoresBySection: SEOScore[];
  averageScore: number;
  lastCalculated: string | null;
}

export const useCMSSEOScores = () => {
  return useQuery({
    queryKey: ['cms-seo-scores'],
    queryFn: async (): Promise<CMSSEOScores> => {
      const { data: scores, error } = await supabase
        .from('cms_seo_scores')
        .select(`
          *,
          site_content!inner(page_section)
        `)
        .order('calculated_at', { ascending: false });

      if (error) throw error;

      const scoresBySection = scores?.map((score: any) => ({
        id: score.id,
        content_id: score.content_id,
        readability_score: score.readability_score,
        keyword_density: score.keyword_density,
        length_score: score.length_score,
        cta_score: score.cta_score,
        emoji_score: score.emoji_score,
        total_score: score.total_score,
        suggestions: score.suggestions || [],
        calculated_at: score.calculated_at,
        section: score.site_content?.page_section,
      })) || [];

      // Get most recent score per content_id
      const latestScores = new Map<string, SEOScore>();
      scoresBySection.forEach((score) => {
        const existing = latestScores.get(score.content_id);
        if (!existing || score.calculated_at > existing.calculated_at) {
          latestScores.set(score.content_id, score);
        }
      });

      const uniqueScores = Array.from(latestScores.values());
      const averageScore = uniqueScores.length > 0
        ? Math.round(uniqueScores.reduce((sum, s) => sum + s.total_score, 0) / uniqueScores.length)
        : 0;

      const lastCalculated = uniqueScores.length > 0
        ? uniqueScores[0].calculated_at
        : null;

      return {
        scoresBySection: uniqueScores,
        averageScore,
        lastCalculated,
      };
    },
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });
};

export const useRecalculateSEO = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-cms-seo', {
        body: { content_id: contentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-seo-scores'] });
    },
  });
};
