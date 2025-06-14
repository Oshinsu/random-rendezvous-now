
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const connectedMembers = members.filter(member => member.isConnected);
  const missingMembers = members.filter(member => !member.isConnected);
  const emptySlots = maxParticipants - currentParticipants;

  // Générer les noms masqués "Rander 1", "Rander 2", etc.
  const getMaskedName = (index: number) => `Rander ${index + 1}`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Membres du Groupe ({currentParticipants}/{maxParticipants})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Membres connectés */}
        {connectedMembers.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-green-700 font-semibold mb-3">
              <UserCheck className="h-4 w-4" />
              Connectés ({connectedMembers.length})
            </h4>
            <div className="space-y-2">
              {connectedMembers.map((member, index) => {
                const maskedName = getMaskedName(index);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {maskedName.charAt(0)}
                      </div>
                      <span className="font-medium text-green-900">{maskedName}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      En ligne
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Membres en attente/manquants */}
        {missingMembers.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-orange-700 font-semibold mb-3">
              <Clock className="h-4 w-4" />
              En attente ({missingMembers.length})
            </h4>
            <div className="space-y-2">
              {missingMembers.map((member, index) => {
                const maskedName = getMaskedName(connectedMembers.length + index);
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {maskedName.charAt(0)}
                      </div>
                      <span className="font-medium text-orange-900">{maskedName}</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
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
            <h4 className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
              <UserX className="h-4 w-4" />
              Places libres ({emptySlots})
            </h4>
            <div className="space-y-2">
              {Array.from({ length: emptySlots }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserX className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-gray-600 italic">En attente d'un participant...</span>
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
