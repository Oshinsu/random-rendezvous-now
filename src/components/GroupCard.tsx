
import { Group } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, LogOut, Calendar, Star, Crown, Gem } from 'lucide-react';
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
        text: 'En Attente', 
        className: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-2 border-yellow-300 font-elegant font-bold px-4 py-2 text-sm' 
      },
      full: { 
        variant: 'default' as const, 
        text: 'Complet', 
        className: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-2 border-blue-300 font-elegant font-bold px-4 py-2 text-sm' 
      },
      confirmed: { 
        variant: 'default' as const, 
        text: 'Confirmé', 
        className: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-900 border-2 border-emerald-300 font-elegant font-bold px-4 py-2 text-sm' 
      },
      completed: { 
        variant: 'outline' as const, 
        text: 'Terminé', 
        className: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-300 font-elegant font-bold px-4 py-2 text-sm' 
      },
      cancelled: { 
        variant: 'destructive' as const, 
        text: 'Annulé', 
        className: 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-2 border-red-300 font-elegant font-bold px-4 py-2 text-sm' 
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
    <Card className="w-full glass-luxury border-2 border-yellow-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 luxury-float">
      <CardHeader className="pb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <CardTitle className="text-3xl font-luxury font-black bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
              Cercle #{group.id.slice(-6)}
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Gem className="h-6 w-6 text-yellow-600" />
              <span className="text-lg text-gray-700 font-elegant font-semibold tracking-wide">Expérience Premium</span>
            </div>
          </div>
          {getStatusBadge(group.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Progression des participants luxueuse */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-7 w-7 text-yellow-600" />
              <span className="text-2xl font-luxury font-bold text-gray-800">
                {group.current_participants}/{group.max_participants} membres exclusifs
              </span>
            </div>
            <span className="text-lg text-gray-600 font-elegant font-semibold">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
          
          {/* Barre de progression luxueuse */}
          <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 h-full rounded-full transition-all duration-700 ease-out gold-glow"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Informations du bar premium */}
        {(group.status === 'confirmed' || group.status === 'full') && group.bar_name && (
          <div className="glass-gold border-2 border-emerald-300 rounded-2xl p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <MapPin className="h-7 w-7 text-emerald-700 mt-1 flex-shrink-0" />
              <div>
                <div className="font-luxury font-bold text-emerald-900 text-2xl">{group.bar_name}</div>
                <div className="text-emerald-800 text-lg font-elegant">{group.bar_address}</div>
              </div>
            </div>

            {group.meeting_time && (
              <div className="flex items-start space-x-4 pt-4 border-t-2 border-emerald-200">
                <Calendar className="h-7 w-7 text-emerald-700 mt-1" />
                <div>
                  <div className="font-luxury font-bold text-emerald-900 text-xl">Rendez-vous Premium</div>
                  <div className="text-emerald-800 capitalize font-elegant text-lg">
                    {formatDateTime(group.meeting_time)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message d'attente luxueux */}
        {group.status === 'waiting' && (
          <div className="glass-gold border-2 border-yellow-300 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <Clock className="h-7 w-7 text-yellow-700" />
              <div>
                <div className="font-luxury font-bold text-yellow-900 text-xl">Assemblage en cours</div>
                <div className="text-yellow-800 text-lg font-elegant">
                  Plus que {group.max_participants - group.current_participants} membre{group.max_participants - group.current_participants > 1 ? 's' : ''} pour compléter ce cercle exclusif !
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton quitter luxueux */}
        {showLeaveButton && group.status !== 'completed' && (
          <Button
            onClick={() => leaveGroup(group.id)}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full border-2 border-red-300 text-red-800 hover:bg-red-50 hover:border-red-400 transition-all duration-300 font-elegant font-bold text-lg py-4"
          >
            <LogOut className="h-6 w-6 mr-3" />
            Quitter le Cercle
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupCard;
