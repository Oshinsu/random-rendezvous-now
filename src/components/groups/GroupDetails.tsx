
import { Button } from '@/components/ui/button';
import { Settings, Users2, Calendar, MapPin, Clock } from 'lucide-react';
import { Group } from '@/types/database';

interface GroupDetailsProps {
  group: Group;
  onLeaveGroup: () => void;
  loading: boolean;
}

const GroupDetails = ({ group, onLeaveGroup, loading }: GroupDetailsProps) => {
  const getBarAddress = () => {
    if (group.bar_address) {
      return group.bar_address;
    }
    if (group.bar_latitude && group.bar_longitude) {
      return `Coordonnées: ${group.bar_latitude.toFixed(4)}, ${group.bar_longitude.toFixed(4)}`;
    }
    return "Recherche de bar en cours...";
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-white/50">
      <h3 className="text-base font-heading font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Détails de l'aventure
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 font-medium">Statut</span>
          <span className={`font-semibold text-xs px-2 py-1 rounded-full ${
            group.status === 'confirmed' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {group.status === 'confirmed' ? 'Confirmé' : 'En attente'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 font-medium flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            Participants
          </span>
          <span className="font-semibold text-neutral-800">
            {group.current_participants}/{group.max_participants}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Créé le
          </span>
          <span className="font-medium text-neutral-800">
            {new Date(group.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {group.location_name && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Zone
            </span>
            <span className="font-medium text-neutral-800">
              {group.location_name}
            </span>
          </div>
        )}
        {group.bar_name && (
          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 font-medium">Destination</span>
              <span className="font-semibold text-green-700 text-right max-w-32 truncate">
                {group.bar_name}
              </span>
            </div>
            {(group.bar_address || (group.bar_latitude && group.bar_longitude)) && (
              <div className="flex justify-between items-start">
                <span className="text-neutral-600 font-medium">Adresse</span>
                <span className="font-medium text-neutral-800 text-right max-w-40 text-xs">
                  {getBarAddress()}
                </span>
              </div>
            )}
            {group.meeting_time && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Rendez-vous
                </span>
                <span className="font-semibold text-blue-700 text-xs">
                  {new Date(group.meeting_time).toLocaleString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {group.status !== 'completed' && (
        <Button
          onClick={onLeaveGroup}
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full mt-4 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-xs"
        >
          Quitter l'aventure
        </Button>
      )}
    </div>
  );
};

export default GroupDetails;
