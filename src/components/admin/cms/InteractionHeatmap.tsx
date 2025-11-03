import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCMSAnalytics } from '@/hooks/useCMSAnalytics';

export const InteractionHeatmap = () => {
  const { data: analytics } = useCMSAnalytics();
  
  // Generate heatmap data from real modifications
  const heatmapData = useMemo(() => {
    if (!analytics?.modificationsByDay) {
      return [];
    }

    // Create map of all 90 days with counts
    const dataMap = new Map(
      analytics.modificationsByDay.map(d => [d.date, d.count])
    );

    // Fill in missing days with 0
    const data = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0
      });
    }
    
    return data;
  }, [analytics]);

  // Organiser en semaines
  const weeks = useMemo(() => {
    const organized = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      organized.push(heatmapData.slice(i, i + 7));
    }
    return organized;
  }, [heatmapData]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900';
    if (count <= 4) return 'bg-green-400 dark:bg-green-700';
    if (count <= 6) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-300';
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-colors cursor-pointer`}
                title={`${day.date}: ${day.count} modifications`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm" />
          <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm" />
          <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm" />
          <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-sm" />
          <div className="w-3 h-3 bg-green-800 dark:bg-green-300 rounded-sm" />
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
};
