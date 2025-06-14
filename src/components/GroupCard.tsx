
import { Group } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, LogOut, Calendar, Star } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

interface GroupCardProps {
  group: Group;
  showLeaveButton?: boolean;
}

const GroupCard = ({ group, showLeaveButton = true }: GroupCardProps) => {
  const { leaveGroup, loading } = useGroups();

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: { 
        variant: 'secondary' as const, 
        text: 'En attente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300' 
      },
      full: { 
        variant: 'default' as const, 
        text: 'Complet', 
        className: 'bg-blue-100 text-blue-800 border-blue-300' 
      },
      confirmed: { 
        variant: 'default' as const, 
        text: 'Confirmé', 
        className: 'bg-green-100 text-green-800 border-green-300' 
      },
      completed: { 
        variant: 'outline' as const, 
        text: 'Terminé', 
        className: 'bg-gray-100 text-gray-800 border-gray-300' 
      },
      cancelled: { 
        variant: 'destructive' as const, 
        text: 'Annulé', 
        className: 'bg-red-100 text-red-800 border-red-300' 
      }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.waiting;
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    return (group.current_participants / group.max_participants) * 100;
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white to-amber-50/30 border-2 border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-heading bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
              Groupe #{group.id.slice(-6)}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-gray-600 font-medium">Aventure Random</span>
            </div>
          </div>
          {getStatusBadge(group.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progression des participants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-amber-600" />
              <span className="text-lg font-semibold text-gray-800">
                {group.current_participants}/{group.max_participants} participants
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Informations du bar */}
        {(group.status === 'confirmed' || group.status === 'full') && group.bar_name && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <div className="font-bold text-green-800 text-lg">{group.bar_name}</div>
                <div className="text-green-700 text-sm">{group.bar_address}</div>
              </div>
            </div>

            {group.meeting_time && (
              <div className="flex items-start space-x-3 pt-2 border-t border-green-200">
                <Calendar className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <div className="font-semibold text-green-800">Rendez-vous</div>
                  <div className="text-green-700 capitalize">
                    {formatDateTime(group.meeting_time)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message d'attente */}
        {group.status === 'waiting' && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-800">En attente</div>
                <div className="text-yellow-700 text-sm">
                  Plus que {group.max_participants - group.current_participants} participant{group.max_participants - group.current_participants > 1 ? 's' : ''} pour compléter le groupe !
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton quitter */}
        {showLeaveButton && group.status !== 'completed' && (
          <Button
            onClick={() => leaveGroup(group.id)}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Quitter le groupe
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupCard;
