
import { Group } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, LogOut, Calendar, Navigation } from 'lucide-react';
import { GeolocationService, LocationData } from '@/services/geolocation';

interface GroupCardProps {
  group: Group;
  showLeaveButton?: boolean;
  leaveGroup: (groupId: string) => Promise<void>;
  loading: boolean;
  userLocation: LocationData | null;
}

const GroupCard = ({ group, showLeaveButton = true, leaveGroup, loading, userLocation }: GroupCardProps) => {

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: { 
        variant: 'secondary' as const, 
        text: 'En Attente', 
        className: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-2 border-yellow-300 font-semibold px-4 py-2' 
      },
      full: { 
        variant: 'default' as const, 
        text: 'Complet', 
        className: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-2 border-blue-300 font-semibold px-4 py-2' 
      },
      confirmed: { 
        variant: 'default' as const, 
        text: 'Confirmé', 
        className: 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-900 border-2 border-emerald-300 font-semibold px-4 py-2' 
      },
      completed: { 
        variant: 'outline' as const, 
        text: 'Terminé', 
        className: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-2 border-gray-300 font-semibold px-4 py-2' 
      },
      cancelled: { 
        variant: 'destructive' as const, 
        text: 'Annulé', 
        className: 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-2 border-red-300 font-semibold px-4 py-2' 
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

  const getDistanceToGroup = () => {
    if (!userLocation || !group.latitude || !group.longitude) {
      return null;
    }
    
    const distance = GeolocationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      group.latitude,
      group.longitude
    );
    
    return GeolocationService.formatDistance(distance);
  };

  const groupDistance = getDistanceToGroup();

  const handleLeaveGroup = async () => {
    console.log('🚪 Tentative de quitter le groupe:', group.id);
    try {
      await leaveGroup(group.id);
      console.log('✅ Groupe quitté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sortie du groupe:', error);
    }
  };

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border-2 border-amber-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="space-y-2 sm:space-y-3">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
              Groupe d'Aventure
            </CardTitle>
            <div className="text-xs sm:text-sm text-slate-600">
              Créé le {new Date(group.created_at).toLocaleDateString('fr-FR')}
            </div>
            
            {/* Informations de localisation */}
            {(group.location_name || groupDistance) && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm">
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                <div className="space-x-2 min-w-0 flex-1">
                  {group.location_name && (
                    <span className="text-blue-700 font-medium truncate">{group.location_name}</span>
                  )}
                  {groupDistance && (
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                      à {groupDistance}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="self-start sm:self-auto">
            {getStatusBadge(group.status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Progression des participants */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm sm:text-base md:text-lg font-semibold text-slate-800">
                {group.current_participants}/{group.max_participants} participants
              </span>
            </div>
            <span className="text-xs sm:text-sm text-slate-600 font-medium">
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-slate-200 rounded-full h-2 sm:h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Informations du bar */}
        {(group.status === 'confirmed' || group.status === 'full') && group.bar_name && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-emerald-900 text-base sm:text-lg truncate">{group.bar_name}</div>
                <div className="text-emerald-800 text-xs sm:text-sm break-words">{group.bar_address}</div>
              </div>
            </div>

            {group.meeting_time && (
              <div className="flex items-start space-x-2 sm:space-x-3 pt-2 sm:pt-3 border-t border-emerald-200">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-emerald-900 text-sm sm:text-base">Rendez-vous</div>
                  <div className="text-emerald-800 capitalize text-xs sm:text-sm">
                    {formatDateTime(group.meeting_time)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message d'attente */}
        {group.status === 'waiting' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-700 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-yellow-900 text-sm sm:text-base">En attente de participants</div>
                <div className="text-yellow-800 text-xs sm:text-sm">
                  Plus que {group.max_participants - group.current_participants} participant{group.max_participants - group.current_participants > 1 ? 's' : ''} pour compléter le groupe !
                </div>
                {group.search_radius && (
                  <div className="text-yellow-700 text-xs mt-1">
                    Rayon de recherche: {GeolocationService.formatDistance(group.search_radius)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bouton quitter */}
        {showLeaveButton && group.status !== 'completed' && (
          <Button
            onClick={handleLeaveGroup}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200 font-semibold text-sm sm:text-base"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {loading ? 'Sortie en cours...' : 'Quitter le Groupe'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupCard;
