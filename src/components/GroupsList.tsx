
import { Group } from '@/types/database';
import GroupCard from './GroupCard';

interface GroupsListProps {
  groups: Group[];
  title: string;
  emptyMessage: string;
  showLeaveButton?: boolean;
}

const GroupsList = ({ groups, title, emptyMessage, showLeaveButton = true }: GroupsListProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-heading font-bold">{title}</h2>
      
      {groups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              showLeaveButton={showLeaveButton}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
