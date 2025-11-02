import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock } from 'lucide-react';

interface Group {
  id: string;
  status: string;
  current_participants: number;
  location_name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface GroupsLiveMapProps {
  groups: Group[];
  onGroupClick: (group: Group) => void;
}

export const GroupsLiveMap = ({ groups, onGroupClick }: GroupsLiveMapProps) => {
  return (
    <div className="relative w-full h-[600px] bg-muted rounded-lg overflow-hidden">
      {/* Placeholder for actual map integration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-muted-foreground">
          Map View - Integration with Google Maps coming soon
        </p>
      </div>

      {/* Group markers preview */}
      <div className="absolute top-4 right-4 space-y-2 max-w-sm">
        {groups.slice(0, 5).map((group) => (
          <Card 
            key={group.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onGroupClick(group)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{group.location_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.current_participants}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(group.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={group.status === 'confirmed' ? 'default' : 'secondary'}
                >
                  {group.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
