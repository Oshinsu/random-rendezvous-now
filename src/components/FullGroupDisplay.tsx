import React from 'react';
import { Group } from '@/types/database';
import GroupMap from '@/components/GroupMap';
import GroupChat from '@/components/GroupChat';
import GroupDetails from '@/components/groups/GroupDetails';
import GroupMudra from '@/components/groups/GroupMudra';
import GroupMembersList from '@/components/GroupMembersList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, MessageSquare, Settings, Users } from 'lucide-react';
import { useScheduledGroupEnhancement } from '@/hooks/useScheduledGroupEnhancement';

interface FullGroupDisplayProps {
  group: Group;
  onLeaveGroup?: () => void;
  loading?: boolean;
  showChat?: boolean;
  showMudra?: boolean;
  showMembers?: boolean;
}

const FullGroupDisplay = ({ 
  group, 
  onLeaveGroup, 
  loading = false,
  showChat = true,
  showMudra = true,
  showMembers = true
}: FullGroupDisplayProps) => {
  const { groupMembers, loading: membersLoading } = useScheduledGroupEnhancement(group.id);
  const isGroupComplete = group.current_participants >= 5;
  const shouldShowMudra = showMudra && isGroupComplete && group.bar_name;
  
  const getBarAddress = () => {
    if (group.bar_address) {
      return group.bar_address;
    }
    if (group.bar_latitude && group.bar_longitude) {
      return `Coordonnées: ${group.bar_latitude.toFixed(4)}, ${group.bar_longitude.toFixed(4)}`;
    }
    return "Recherche de bar en cours...";
  };

  const getMeetingTime = () => {
    return group.meeting_time || new Date(Date.now() + 60 * 60 * 1000).toISOString();
  };

  return (
    <div className="space-y-6">
      {/* Affichage carte si groupe complet et bar assigné */}
      {isGroupComplete && group.bar_name && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-800">Votre destination</h3>
          </div>
          <GroupMap
            barName={group.bar_name}
            barAddress={getBarAddress()}
            meetingTime={getMeetingTime()}
            isGroupComplete={isGroupComplete}
            barLatitude={group.bar_latitude}
            barLongitude={group.bar_longitude}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Membres du groupe */}
          {showMembers && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-brand-800">Membres du groupe</h3>
              </div>
              <GroupMembersList
                members={groupMembers}
                maxParticipants={group.max_participants}
                currentParticipants={group.current_participants}
              />
            </div>
          )}

          {/* Chat du groupe */}
          {showChat && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-semibold text-brand-800">Chat du groupe</h3>
              </div>
              <GroupChat
                groupId={group.id}
                isGroupComplete={isGroupComplete}
                barName={group.bar_name}
              />
            </div>
          )}
        </div>

        {/* Détails du groupe */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-neutral-600" />
            <h3 className="text-lg font-semibold text-neutral-800">Détails du groupe</h3>
          </div>
          {onLeaveGroup ? (
            <GroupDetails
              group={group}
              onLeaveGroup={onLeaveGroup}
              loading={loading}
            />
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-white/50">
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
                  <span className="text-neutral-600 font-medium">Participants</span>
                  <span className="font-semibold text-neutral-800">
                    {group.current_participants}/{group.max_participants}
                  </span>
                </div>
                {group.bar_name && (
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600 font-medium">Destination</span>
                      <span className="font-semibold text-green-700 text-right max-w-32 truncate">
                        {group.bar_name}
                      </span>
                    </div>
                    {group.meeting_time && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-600 font-medium">Rendez-vous</span>
                        <span className="font-semibold text-blue-700 text-xs">
                          {new Date(group.meeting_time).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mudra de reconnaissance si approprié */}
      {shouldShowMudra && <GroupMudra />}
    </div>
  );
};

export default FullGroupDisplay;