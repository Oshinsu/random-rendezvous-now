import { CRMSegmentCard } from './CRMSegmentCard';
import { useCRMSegments } from '@/hooks/useCRMSegments';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Users, UserX, UserPlus, UserCheck, AlertCircle, Star } from 'lucide-react';

const segmentIcons: Record<string, any> = {
  'active': UserCheck,
  'dormant': UserX,
  'new_users': UserPlus,
  'one_timer': Users,
  'churn_risk': AlertCircle,
  'super_users': Star,
};

export const CRMSegmentsTab = () => {
  const { segments, loading } = useCRMSegments();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
  );
};
