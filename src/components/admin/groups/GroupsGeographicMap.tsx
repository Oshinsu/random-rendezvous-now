import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GeographicData {
  location_name: string;
  group_count: number;
  avg_participants: number;
  success_count: number;
  success_rate: number;
  unique_bars: number;
  avg_latitude: number;
  avg_longitude: number;
}

interface GroupsGeographicMapProps {
  data: GeographicData[];
}

export const GroupsGeographicMap = ({ data }: GroupsGeographicMapProps) => {
  const maxCount = Math.max(...data.map(d => d.group_count), 1);

  const getSuccessColor = (rate: number) => {
    if (rate >= 50) return 'bg-green-500';
    if (rate >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Distribution Géographique</h3>
          <p className="text-sm text-muted-foreground">Top 20 zones - 30 derniers jours</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <MapPin className="w-3 h-3" />
          {data.length} zones
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {data.map((zone, index) => {
            const intensity = (zone.group_count / maxCount) * 100;
            
            return (
              <div
                key={zone.location_name}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium group-hover:text-primary transition-colors">
                        {zone.location_name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {zone.group_count} groupes • {zone.avg_participants.toFixed(1)} participants moy.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {zone.success_rate}% succès
                    </Badge>
                    {zone.unique_bars > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {zone.unique_bars} bars
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">Activité</span>
                    <TrendingUp className="w-3 h-3 text-primary" />
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getSuccessColor(zone.success_rate)} transition-all duration-500`}
                      style={{ width: `${intensity}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
