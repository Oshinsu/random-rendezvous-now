import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, MessageSquare, CheckCircle } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export const ActivityTimeline = ({ events }: ActivityTimelineProps) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'group_joined': return <Users className="h-4 w-4" />;
      case 'group_created': return <MapPin className="h-4 w-4" />;
      case 'message_sent': return <MessageSquare className="h-4 w-4" />;
      case 'outing_completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'group_joined': return 'border-blue-500 bg-blue-50';
      case 'group_created': return 'border-green-500 bg-green-50';
      case 'message_sent': return 'border-purple-500 bg-purple-50';
      case 'outing_completed': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune activité récente
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-gray-200 mt-2" />
            )}
          </div>
          <div className="flex-1 pb-6">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <Badge variant="outline" className="text-xs">
                {new Date(event.timestamp).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
            {event.description && (
              <p className="text-xs text-muted-foreground">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
