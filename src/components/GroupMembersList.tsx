
import { Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

interface GroupMember {
  id: string;
  name: string;
  isConnected: boolean;
  joinedAt: string;
  status: 'confirmed' | 'pending';
}

interface GroupMembersListProps {
  members: GroupMember[];
  maxParticipants: number;
  currentParticipants: number;
}

const GroupMembersList = ({ members, maxParticipants, currentParticipants }: GroupMembersListProps) => {
  // ✅ Filtrer les membres par statut de connexion
  const connectedMembers = members.filter(m => m.isConnected);
  const disconnectedMembers = members.filter(m => !m.isConnected);
  
  // Animation joyeuse à l'arrivée d'un membre
  const [animateJoin, setAnimateJoin] = useState(false);
  useEffect(() => {
    const handler = () => {
      setAnimateJoin(true);
      setTimeout(() => setAnimateJoin(false), 900);
    };
    window.addEventListener('group:member-joined', handler);
    return () => window.removeEventListener('group:member-joined', handler);
  }, []);
  
  // Calcul correct des places libres basé sur les membres réels
  const actualParticipants = members.length;
  const emptySlots = Math.max(0, maxParticipants - actualParticipants);
  
  // Utiliser les données réelles plutôt que la DB pour l'affichage
  const displayParticipants = actualParticipants;

  // Générer les noms masqués "Rander 1", "Rander 2", etc.
  const getMaskedName = (index: number) => `Rander ${index + 1}`;

  return (
    <Card className={`w-full transition-all duration-500 ${animateJoin ? 'animate-enter ring-4 ring-brand-300 shadow-glow' : ''}`}>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
          <span className="truncate">👥 Membres du Groupe ({displayParticipants}/{maxParticipants})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Membres connectés (tous les membres sont connectés maintenant) */}
        {connectedMembers.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-green-700 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-transform hover:scale-110" />
              <span>✅ Connectés ({connectedMembers.length})</span>
            </h4>
            <div className="space-y-2">
              {connectedMembers.map((member, index) => {
                const maskedName = getMaskedName(index);
                return (
                  <div key={member.id} className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                        {maskedName.charAt(0)}
                      </div>
                      <span className="font-medium text-green-900 text-sm sm:text-base truncate">{maskedName}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                      En ligne
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Membres déconnectés */}
        {disconnectedMembers.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-neutral-500 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-transform hover:scale-110" />
              <span>💤 Hors ligne ({disconnectedMembers.length})</span>
            </h4>
            <div className="space-y-2">
              {disconnectedMembers.map((member, index) => {
                const maskedName = getMaskedName(connectedMembers.length + index);
                return (
                  <div key={member.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 opacity-60">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                        {maskedName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-700 text-sm sm:text-base truncate">{maskedName}</span>
                    </div>
                    <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs flex-shrink-0">
                      Hors ligne
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Places libres */}
        {emptySlots > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-neutral-700 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 transition-transform hover:scale-110" />
              <span>⏳ Places libres ({emptySlots})</span>
            </h4>
            <div className="space-y-2">
              {Array.from({ length: emptySlots }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  </div>
                  <span className="text-gray-600 italic text-xs sm:text-sm">En attente d'un participant...</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupMembersList;
