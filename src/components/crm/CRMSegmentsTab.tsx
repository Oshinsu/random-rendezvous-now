import { CRMSegmentCard } from './CRMSegmentCard';
import { useCRMSegments } from '@/hooks/useCRMSegments';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserX, UserPlus, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

const segmentIcons: Record<string, any> = {
  'active': UserCheck,
  'new_users': UserPlus,
  'zombie_users': UserX,
  'dormant': Users,
  'churn_risk': AlertCircle,
};

export const CRMSegmentsTab = () => {
  const { segments, loading, refetch } = useCRMSegments();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const { error } = await supabase.functions.invoke('calculate-all-health-scores');
      
      if (error) throw error;
      
      toast.success('Segments recalculés avec succès');
      
      // Attendre 2 secondes avant de rafraîchir pour laisser le temps au calcul
      setTimeout(() => {
        refetch();
        setIsRecalculating(false);
      }, 2000);
    } catch (error) {
      console.error('Error recalculating segments:', error);
      toast.error('Erreur lors du recalcul des segments');
      setIsRecalculating(false);
    }
  };

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
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            📊 Les 5 Segments Essentiels
          </h3>
          <Button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalculer les segments
          </Button>
        </div>
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
