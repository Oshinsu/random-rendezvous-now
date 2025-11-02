import { Button } from '@/components/ui/button';
import { Settings, Users2, Calendar, MapPin, Clock } from 'lucide-react';
import { Group } from '@/types/database';
import GroupForceConfirmButton from '@/components/GroupForceConfirmButton';
import { useTranslation } from 'react-i18next';

interface GroupDetailsProps {
  group: Group;
  onLeaveGroup: () => void;
  loading: boolean;
}

const GroupDetails = ({ group, onLeaveGroup, loading }: GroupDetailsProps) => {
  const { t } = useTranslation();
  
  const getBarAddress = () => {
    if (group.bar_address) {
      return group.bar_address;
    }
    if (group.bar_latitude && group.bar_longitude) {
      return t('groups.coordinates', { 
        lat: group.bar_latitude.toFixed(4), 
        lng: group.bar_longitude.toFixed(4) 
      });
    }
    return t('groups.bar_search_progress');
  };

  const canForceConfirm = 
    group.current_participants >= 3 && 
    group.current_participants < 5 && 
    group.status === 'waiting' && 
    !group.bar_name;

  return (
    <div className="space-y-4">
      {/* Bouton de confirmation anticipée */}
      {canForceConfirm && (
        <GroupForceConfirmButton 
          groupId={group.id} 
          currentParticipants={group.current_participants} 
        />
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-white/50 dark:bg-neutral-900/80 dark:border-neutral-700">
        <h3 className="text-base font-heading font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {t('groups.adventure_details')}
        </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium">{t('groups.status')}</span>
          <span className={`font-semibold text-xs px-2 py-1 rounded-full ${
            group.status === 'confirmed' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            {group.status === 'confirmed' ? t('groups.status_confirmed') : t('groups.status_waiting')}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            {t('groups.participants')}
          </span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            {group.current_participants}/{group.max_participants}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t('groups.created_on')}
          </span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {new Date(group.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {group.location_name && (
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {t('groups.zone')}
            </span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              {group.location_name}
            </span>
          </div>
        )}
        {group.bar_name && (
          <div className="border-t dark:border-neutral-700 pt-3 mt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">{t('groups.destination')}</span>
              <span className="font-semibold text-green-700 dark:text-green-400 text-right max-w-32 truncate">
                {group.bar_name}
              </span>
            </div>
            {(group.bar_address || (group.bar_latitude && group.bar_longitude)) && (
              <div className="flex justify-between items-start">
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">{t('groups.address')}</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right max-w-40 text-xs">
                  {getBarAddress()}
                </span>
              </div>
            )}
            {group.meeting_time && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('groups.meeting_time')}
                </span>
                <span className="font-semibold text-blue-700 dark:text-blue-400 text-xs">
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
            className="w-full mt-4 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-xs dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            {t('groups.leave_adventure')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;
