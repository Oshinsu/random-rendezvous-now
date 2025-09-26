import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BarOwner, BarSubscription } from './useBarOwner';

export interface BarOwnerWithSubscription extends BarOwner {
  subscription?: BarSubscription;
}

export const useAdminBarOwners = () => {
  const queryClient = useQueryClient();

  // Get all bar owners (admin only)
  const { data: barOwners, isLoading } = useQuery({
    queryKey: ['adminBarOwners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bar_owners')
        .select(`
          *,
          bar_subscriptions (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(owner => ({
        ...owner,
        subscription: owner.bar_subscriptions?.[0] || null,
      })) as BarOwnerWithSubscription[];
    },
  });

  // Approve/reject bar owner application
  const updateApplicationStatus = useMutation({
    mutationFn: async ({
      barOwnerId,
      status,
      notes,
    }: {
      barOwnerId: string;
      status: 'approved' | 'rejected';
      notes?: string;
    }) => {
      const updates: any = {
        status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('bar_owners')
        .update(updates)
        .eq('id', barOwnerId);
      
      if (error) throw error;

      // If approved, create trial subscription
      if (status === 'approved') {
        const { error: subscriptionError } = await supabase
          .from('bar_subscriptions')
          .insert({
            bar_owner_id: barOwnerId,
            status: 'trial',
            plan_type: 'trial',
          });
        
        if (subscriptionError) throw subscriptionError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminBarOwners'] });
      toast.success(
        variables.status === 'approved' 
          ? 'Demande approuvée ! Essai gratuit de 30 jours activé.'
          : 'Demande rejetée.'
      );
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Suspend/reactivate bar owner
  const toggleSuspension = useMutation({
    mutationFn: async ({ barOwnerId, suspend }: { barOwnerId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from('bar_owners')
        .update({ status: suspend ? 'suspended' : 'approved' })
        .eq('id', barOwnerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBarOwners'] });
      toast.success('Statut mis à jour');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Delete bar owner
  const deleteBarOwner = useMutation({
    mutationFn: async (barOwnerId: string) => {
      const { error } = await supabase
        .from('bar_owners')
        .delete()
        .eq('id', barOwnerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBarOwners'] });
      toast.success('Gérant supprimé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression: ' + error.message);
    },
  });

  // Get bar owner stats
  const { data: stats } = useQuery({
    queryKey: ['barOwnerStats'],
    queryFn: async () => {
      const { data: owners } = await supabase
        .from('bar_owners')
        .select('status');
      
      const { data: subscriptions } = await supabase
        .from('bar_subscriptions')
        .select('status');
      
      if (!owners || !subscriptions) return null;
      
      return {
        total: owners.length,
        pending: owners.filter(o => o.status === 'pending').length,
        approved: owners.filter(o => o.status === 'approved').length,
        rejected: owners.filter(o => o.status === 'rejected').length,
        suspended: owners.filter(o => o.status === 'suspended').length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        trialSubscriptions: subscriptions.filter(s => s.status === 'trial').length,
      };
    },
  });

  return {
    barOwners,
    stats,
    isLoading,
    updateApplicationStatus,
    toggleSuspension,
    deleteBarOwner,
  };
};