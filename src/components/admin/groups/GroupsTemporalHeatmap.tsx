import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface HeatmapData {
  day_of_week: number;
  hour_of_day: number;
  group_count: number;
  avg_participants: number;
  confirmed_count: number;
  conversion_rate: number;
}

interface GroupsTemporalHeatmapProps {
  data: HeatmapData[];
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`);

export const GroupsTemporalHeatmap = ({ data }: GroupsTemporalHeatmapProps) => {
  const maxCount = Math.max(...data.map(d => d.group_count), 1);
  
  const getIntensityColor = (count: number) => {
    const intensity = (count / maxCount) * 100;
    if (intensity === 0) return 'bg-secondary';
    if (intensity < 20) return 'bg-yellow-200 dark:bg-yellow-900/30';
    if (intensity < 40) return 'bg-yellow-300 dark:bg-yellow-800/40';
    if (intensity < 60) return 'bg-orange-300 dark:bg-orange-800/50';
    if (intensity < 80) return 'bg-orange-400 dark:bg-orange-700/60';
    return 'bg-red-500 dark:bg-red-600/70';
  };

  const getCellData = (day: number, hour: number) => {
    return data.find(d => d.day_of_week === day && d.hour_of_day === hour);
  };

  const isPeakHour = (count: number) => {
    const avg = data.reduce((sum, d) => sum + d.group_count, 0) / data.length;
    const std = Math.sqrt(
      data.reduce((sum, d) => sum + Math.pow(d.group_count - avg, 2), 0) / data.length
    );
    return count > avg + std;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Patterns Temporels</h3>
          <p className="text-sm text-muted-foreground">Heatmap 7 jours × 24 heures</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          30 derniers jours
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header heures */}
          <div className="flex mb-1">
            <div className="w-12" /> {/* Spacer pour les jours */}
            {HOURS.map((hour, i) => (
              <div
                key={hour}
                className="flex-1 min-w-[32px] text-center text-xs text-muted-foreground"
                style={{ display: i % 2 === 0 ? 'block' : 'none' }}
              >
                {i % 4 === 0 ? hour : ''}
              </div>
            ))}
          </div>

          {/* Grille heatmap */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-12 text-xs font-medium text-muted-foreground">
                {day}
              </div>
              <div className="flex gap-1 flex-1">
                {HOURS.map((_, hour) => {
                  const cellData = getCellData(dayIndex, hour);
                  const count = cellData?.group_count || 0;
                  const isPeak = cellData && isPeakHour(count);

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`
                        group relative flex-1 min-w-[32px] h-8 rounded 
                        ${getIntensityColor(count)}
                        ${isPeak ? 'ring-2 ring-primary' : ''}
                        hover:scale-110 hover:z-10 transition-all duration-200 cursor-pointer
                      `}
                      title={`${day} ${hour}h: ${count} groupes`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                        <div className="bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg border whitespace-nowrap">
                          <div className="font-semibold">{day} {hour}h</div>
                          <div className="text-muted-foreground">
                            {count} groupes créés
                            {cellData && (
                              <>
                                <br />
                                {cellData.conversion_rate}% conversion
                                <br />
                                {cellData.avg_participants.toFixed(1)} participants moy.
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Légende */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Faible activité</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded bg-secondary" />
                <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900/30" />
                <div className="w-4 h-4 rounded bg-orange-300 dark:bg-orange-800/50" />
                <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-600/70" />
              </div>
              <span>Haute activité</span>
            </div>
            <Badge variant="secondary" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Créneaux peak
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
