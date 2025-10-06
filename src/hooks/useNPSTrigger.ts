import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useNPSTrigger = (groupId: string | undefined) => {
  useEffect(() => {
    if (!groupId) return;

    const checkNPSTrigger = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if group is completed
        const { data: group } = await supabase
          .from('groups')
          .select('status, completed_at')
          .eq('id', groupId)
          .single();

        if (group?.status !== 'completed') return;

        // Check if user already gave feedback for this group
        const { data: existingFeedback } = await supabase
          .from('crm_user_feedback')
          .select('id')
          .eq('user_id', user.id)
          .eq('group_id', groupId)
          .eq('feedback_type', 'nps')
          .maybeSingle();

        if (existingFeedback) return;

        // Trigger NPS request after 1 hour (configurable)
        const completedAt = new Date(group.completed_at);
        const now = new Date();
        const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCompletion >= 1 && hoursSinceCompletion < 24) {
          toast({
            title: "Partagez votre expérience !",
            description: "Comment s'est passée votre sortie ?",
            duration: 10000,
          });
        }
      } catch (error) {
        console.error('Error checking NPS trigger:', error);
      }
    };

    checkNPSTrigger();
  }, [groupId]);
};
