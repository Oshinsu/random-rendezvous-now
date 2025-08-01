
import { Group } from '@/types/database';
import GroupCard from './GroupCard';
import { LocationData } from '@/services/geolocation';

interface GroupsListProps {
  groups: Group[];
  title: string;
  emptyMessage: string;
  showLeaveButton?: boolean;
  leaveGroup: (groupId: string) => Promise<void>;
  loading: boolean;
  userLocation: LocationData | null;
}

const GroupsList = ({ 
  groups, 
  title, 
  emptyMessage, 
  showLeaveButton = true,
  leaveGroup,
  loading,
  userLocation
}: GroupsListProps) => {
  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      )}
      
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              showLeaveButton={showLeaveButton}
              leaveGroup={leaveGroup}
              loading={loading}
              userLocation={userLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
