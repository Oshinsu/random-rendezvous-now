import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BarOwner } from './useBarOwner';

// No more local subscription - Stripe is the source of truth
export type BarOwnerWithSubscription = BarOwner;

export const useAdminBarOwners = () => {
  const queryClient = useQueryClient();

  // Get all bar owners (admin only)
  const { data: barOwners, isLoading } = useQuery({
    queryKey: ['adminBarOwners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bar_owners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as BarOwnerWithSubscription[];
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

      // Note: Subscription is now managed exclusively by Stripe
      // No local trial subscription creation needed
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminBarOwners'] });
      toast.success(
        variables.status === 'approved' 
          ? 'Demande approuvée ! Le gérant peut maintenant s\'abonner via Stripe.'
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

  // Get bar owner stats (subscription data now from Stripe only)
  const { data: stats } = useQuery({
    queryKey: ['barOwnerStats'],
    queryFn: async () => {
      const { data: owners } = await supabase
        .from('bar_owners')
        .select('status');
      
      if (!owners) return null;
      
      return {
        total: owners.length,
        pending: owners.filter(o => o.status === 'pending').length,
        approved: owners.filter(o => o.status === 'approved').length,
        rejected: owners.filter(o => o.status === 'rejected').length,
        suspended: owners.filter(o => o.status === 'suspended').length,
        // Note: Active subscription counts should now be fetched from Stripe
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