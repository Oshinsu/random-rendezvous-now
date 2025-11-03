import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SectionEngagement {
  section: string;
  clicks: number;
  conversions: number;
  views: number;
  bounces: number;
}

interface CMSPageAnalytics {
  engagementBySection: SectionEngagement[];
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
}

export const useCMSPageAnalytics = () => {
  return useQuery({
    queryKey: ['cms-page-analytics'],
    queryFn: async (): Promise<CMSPageAnalytics> => {
      // Refresh materialized view first
      await supabase.rpc('refresh_cms_engagement');

      // Query aggregated data
      const { data, error } = await supabase
        .from('cms_engagement_summary')
        .select('*')
        .order('page_section');

      if (error) throw error;

      // Group by section
      const sectionMap = new Map<string, SectionEngagement>();
      
      data?.forEach((row) => {
        const section = row.page_section;
        if (!sectionMap.has(section)) {
          sectionMap.set(section, {
            section,
            clicks: 0,
            conversions: 0,
            views: 0,
            bounces: 0,
          });
        }

        const sectionData = sectionMap.get(section)!;
        switch (row.event_type) {
          case 'click':
            sectionData.clicks += row.event_count;
            break;
          case 'conversion':
            sectionData.conversions += row.event_count;
            break;
          case 'view':
            sectionData.views += row.event_count;
            break;
          case 'bounce':
            sectionData.bounces += row.event_count;
            break;
        }
      });

      const engagementBySection = Array.from(sectionMap.values());

      const totalClicks = engagementBySection.reduce((sum, s) => sum + s.clicks, 0);
      const totalConversions = engagementBySection.reduce((sum, s) => sum + s.conversions, 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      return {
        engagementBySection,
        totalClicks,
        totalConversions,
        conversionRate,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
