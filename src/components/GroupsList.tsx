
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
    <div className="space-y-6">
      {title && (
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
      )}
      
      {groups.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-sm">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
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
