
import { Group } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, LogOut } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

interface GroupCardProps {
  group: Group;
  showLeaveButton?: boolean;
}

const GroupCard = ({ group, showLeaveButton = true }: GroupCardProps) => {
  const { leaveGroup, loading } = useGroups();

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: { variant: 'secondary' as const, text: 'En attente' },
      full: { variant: 'default' as const, text: 'Complet' },
      confirmed: { variant: 'default' as const, text: 'Confirmé' },
      completed: { variant: 'outline' as const, text: 'Terminé' },
      cancelled: { variant: 'destructive' as const, text: 'Annulé' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.waiting;
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Groupe Random #{group.id.slice(-6)}</CardTitle>
          {getStatusBadge(group.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {group.current_participants}/{group.max_participants} participants
          </span>
        </div>

        {group.status === 'full' && group.bar_name && (
          <>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{group.bar_name}</div>
                <div className="text-muted-foreground">{group.bar_address}</div>
              </div>
            </div>

            {group.meeting_time && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Rendez-vous : {formatDateTime(group.meeting_time)}
                </span>
              </div>
            )}
          </>
        )}

        {group.status === 'waiting' && (
          <div className="text-sm text-muted-foreground">
            En attente de {group.max_participants - group.current_participants} participants...
          </div>
        )}

        {showLeaveButton && group.status !== 'completed' && (
          <Button
            onClick={() => leaveGroup(group.id)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Quitter le groupe
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupCard;
