import { CRMSegmentCard } from './CRMSegmentCard';
import { useCRMSegments } from '@/hooks/useCRMSegments';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Users, UserX, UserPlus, UserCheck, AlertCircle } from 'lucide-react';

const segmentIcons: Record<string, any> = {
  'active': UserCheck,
  'new_users': UserPlus,
  'zombie_users': UserX,
  'dormant': Users,
  'churn_risk': AlertCircle,
};

export const CRMSegmentsTab = () => {
  const { segments, loading } = useCRMSegments();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg border border-border">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          📊 Les 5 Segments Essentiels
        </h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">✅ Actifs</span> (connectés + sorties) • 
          <span className="font-medium ml-1">🆕 Nouveaux</span> ({"<"} 7 jours) • 
          <span className="font-medium ml-1">🧟 Zombies</span> (jamais connectés) • 
          <span className="font-medium ml-1">😴 Dormants</span> (30+ jours) • 
          <span className="font-medium ml-1">💀 Risque Critique</span> (churn)
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <CRMSegmentCard
            key={segment.id}
            name={segment.segment_name}
            description={segment.description || ''}
            userCount={segment.user_count || 0}
            color={segment.color}
            icon={segmentIcons[segment.segment_key] || Users}
          />
        ))}
      </div>
    </div>
  );
};
