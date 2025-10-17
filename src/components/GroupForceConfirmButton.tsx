import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useForceConfirmVotes } from '@/hooks/useForceConfirmVotes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

interface GroupForceConfirmButtonProps {
  groupId: string;
  currentParticipants: number;
}

const GroupForceConfirmButton = ({ groupId, currentParticipants }: GroupForceConfirmButtonProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { votesCount, requiredVotes, hasVoted, canConfirm, refetch } = useForceConfirmVotes(
    groupId,
    currentParticipants
  );

  const handleVote = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('force_confirm_incomplete_group' as any, {
        p_group_id: groupId,
        p_user_id: user.id,
      });

      if (error) throw error;

      const result = data as any;

      if (!result || !result.success) {
        toast.error(result?.error || 'Erreur lors du vote');
        return;
      }

      if (result.confirmed) {
        toast.success('🎉 Groupe confirmé ! Recherche de bar en cours...');
        
        // Envoyer notification push aux autres membres
        const { data: participants } = await supabase
          .from('group_participants')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('status', 'confirmed')
          .neq('user_id', user.id);

        if (participants && participants.length > 0) {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_ids: participants.map(p => p.user_id),
              title: '🎉 Groupe confirmé !',
              body: `Le groupe part à ${currentParticipants} personnes. Recherche de bar en cours...`,
              data: { group_id: groupId, type: 'force_confirm' },
              icon: 'https://api.iconify.design/mdi:check-circle.svg',
            },
          });
        }
      } else {
        toast.success(`✓ Votre vote a été enregistré (${result.votes}/${result.required})`);
        
        // Notifier les autres membres qu'il y a un nouveau vote
        const { data: participants } = await supabase
          .from('group_participants')
          .select('user_id, profiles!inner(first_name)')
          .eq('group_id', groupId)
          .eq('status', 'confirmed')
          .neq('user_id', user.id);

        if (participants && participants.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single();

          const voterName = profile?.first_name || 'Un membre';
          
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_ids: participants.map((p: any) => p.user_id),
              title: '🗳️ Nouveau vote pour partir maintenant',
              body: `${voterName} souhaite partir avec le groupe actuel (${result.votes}/${result.required} votes)`,
              data: { group_id: groupId, type: 'force_confirm_vote' },
              icon: 'https://api.iconify.design/mdi:vote.svg',
            },
          });
        }
      }

      refetch();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Erreur lors du vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            Partir avec {currentParticipants} personnes ?
          </h3>
        </div>

        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
          Marre d'attendre ? Si tous les membres sont d'accord, vous pouvez confirmer le groupe
          maintenant et trouver un bar !
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Votes pour confirmer :
            </span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              {votesCount}/{requiredVotes}
            </Badge>
          </div>

          {!hasVoted ? (
            <Button
              onClick={handleVote}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Je veux partir maintenant
            </Button>
          ) : (
            <Button disabled className="w-full bg-green-600 dark:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Vous avez voté ({votesCount}/{requiredVotes})
            </Button>
          )}
        </div>

        {votesCount > 0 && votesCount < requiredVotes && (
          <Alert className="bg-amber-100/50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
              En attente des autres membres. Les votes expirent après 1 heure.
            </AlertDescription>
          </Alert>
        )}

        {canConfirm && (
          <Alert className="bg-green-100/50 border-green-300 dark:bg-green-950/30 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400" />
            <AlertDescription className="text-xs text-green-800 dark:text-green-200">
              Unanimité atteinte ! Confirmation automatique en cours...
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default GroupForceConfirmButton;
