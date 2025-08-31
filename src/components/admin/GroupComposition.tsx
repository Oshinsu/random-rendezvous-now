import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Crown, Users, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface GroupParticipant {
  id: string;
  user_id: string;
  joined_at: string;
  last_seen?: string;
  status: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface GroupCompositionProps {
  participants: GroupParticipant[];
  createdByUserId?: string;
  createdAt: string;
}

export const GroupComposition = ({ participants, createdByUserId, createdAt }: GroupCompositionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const confirmedParticipants = participants?.filter(p => p.status === 'confirmed') || [];
  
  // Déterminer l'initiateur du groupe
  const initiator = createdByUserId 
    ? confirmedParticipants.find(p => p.user_id === createdByUserId)
    : confirmedParticipants.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())[0];

  const otherMembers = confirmedParticipants.filter(p => p.id !== initiator?.id);

  const formatName = (participant: GroupParticipant) => {
    const profile = participant.profiles;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
    return `Utilisateur ${participant.user_id.slice(-4)}`;
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Jamais vu';
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffMs = now.getTime() - seen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 5) return 'En ligne';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return `Il y a ${Math.floor(diffMins / 1440)}j`;
  };

  const getActivityStatus = (lastSeen?: string) => {
    if (!lastSeen) return 'offline';
    const diffMs = new Date().getTime() - new Date(lastSeen).getTime();
    if (diffMs < 5 * 60 * 1000) return 'online'; // 5 minutes
    if (diffMs < 30 * 60 * 1000) return 'recent'; // 30 minutes
    return 'offline';
  };

  if (confirmedParticipants.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Aucun membre
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Résumé compact */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm">
          {confirmedParticipants.length} membre{confirmedParticipants.length > 1 ? 's' : ''}
        </span>
        {initiator && (
          <Badge variant="outline" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            {formatName(initiator)}
          </Badge>
        )}
      </div>

      {/* Détails expandables */}
      {confirmedParticipants.length > 1 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-1">
              {isOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <span className="text-xs ml-1">
                {isOpen ? 'Masquer' : 'Détails'}
              </span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2 mt-2">
            {/* Initiateur */}
            {initiator && (
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md border-l-2 border-blue-200">
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {formatName(initiator)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Initiateur
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatLastSeen(initiator.last_seen)}
                  <div className={`w-2 h-2 rounded-full ${
                    getActivityStatus(initiator.last_seen) === 'online' ? 'bg-green-500' :
                    getActivityStatus(initiator.last_seen) === 'recent' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            )}

            {/* Autres membres */}
            {otherMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {formatName(member)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatLastSeen(member.last_seen)}
                  <div className={`w-2 h-2 rounded-full ${
                    getActivityStatus(member.last_seen) === 'online' ? 'bg-green-500' :
                    getActivityStatus(member.last_seen) === 'recent' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};