import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";

interface ModificationBySection {
  section: string;
  count: number;
  lastModified: string;
}

interface ModificationByDay {
  date: string;
  count: number;
}

interface CMSAnalytics {
  modificationsBySection: ModificationBySection[];
  modificationsByDay: ModificationByDay[];
  totalModifications: number;
  lastModification: string | null;
  engagementScore: number;
  trend: number; // % change vs last week
}

export const useCMSAnalytics = () => {
  return useQuery({
    queryKey: ['cms-analytics'],
    queryFn: async (): Promise<CMSAnalytics> => {
      const nintyDaysAgo = subDays(new Date(), 90);
      const sevenDaysAgo = subDays(new Date(), 7);

      // Get all modifications in last 90 days
      const { data: modifications, error } = await supabase
        .from('site_content')
        .select('page_section, updated_at, content_key')
        .gte('updated_at', nintyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Aggregate by section
      const sectionMap = new Map<string, { count: number; lastModified: string }>();
      modifications?.forEach((mod) => {
        const section = mod.page_section || 'other';
        const existing = sectionMap.get(section);
        if (!existing) {
          sectionMap.set(section, { count: 1, lastModified: mod.updated_at });
        } else {
          existing.count++;
          if (mod.updated_at > existing.lastModified) {
            existing.lastModified = mod.updated_at;
          }
        }
      });

      const modificationsBySection: ModificationBySection[] = Array.from(sectionMap.entries()).map(
        ([section, data]) => ({
          section,
          count: data.count,
          lastModified: data.lastModified,
        })
      );

      // Aggregate by day
      const dayMap = new Map<string, number>();
      modifications?.forEach((mod) => {
        const day = format(new Date(mod.updated_at), 'yyyy-MM-dd');
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });

      const modificationsByDay: ModificationByDay[] = Array.from(dayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate engagement score (0-100)
      const totalModifications = modifications?.length || 0;
      const avgModsPerDay = totalModifications / 90;
      const engagementScore = Math.min(100, Math.round(avgModsPerDay * 20)); // 5 mods/day = 100

      // Calculate trend (last 7 days vs previous 7 days)
      const recentMods = modifications?.filter(
        (m) => new Date(m.updated_at) >= sevenDaysAgo
      ).length || 0;
      const previousMods = modifications?.filter(
        (m) =>
          new Date(m.updated_at) >= subDays(sevenDaysAgo, 7) &&
          new Date(m.updated_at) < sevenDaysAgo
      ).length || 0;
      
      const trend = previousMods === 0 
        ? 100 
        : Math.round(((recentMods - previousMods) / previousMods) * 100);

      return {
        modificationsBySection,
        modificationsByDay,
        totalModifications,
        lastModification: modifications?.[0]?.updated_at || null,
        engagementScore,
        trend,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
