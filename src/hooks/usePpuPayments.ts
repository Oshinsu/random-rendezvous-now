import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PpuConfig {
  enabled: boolean;
  priceEur: number;
}

export interface GroupPayment {
  id: string;
  group_id: string;
  total_amount_cents: number;
  status: string;
  payment_deadline: string;
  created_at: string;
}

export interface MemberPayment {
  id: string;
  group_payment_id: string;
  user_id: string;
  amount_cents: number;
  status: string;
  paid_at?: string;
}

export const usePpuPayments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check PPU configuration
  const { data: ppuConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['ppuConfig'],
    queryFn: async () => {
      try {
        const [{ data: enabled, error: enabledError }, { data: price, error: priceError }] = await Promise.all([
          supabase.rpc('is_ppu_mode_enabled'),
          supabase.rpc('get_ppu_price_cents')
        ]);

        if (enabledError) {
          console.error('Error fetching PPU enabled status:', enabledError);
        }
        if (priceError) {
          console.error('Error fetching PPU price:', priceError);
        }

        return {
          enabled: enabled || false,
          priceEur: (price || 99) / 100
        } as PpuConfig;
      } catch (error) {
        console.error('Error in ppuConfig query:', error);
        return {
          enabled: false,
          priceEur: 0.99
        } as PpuConfig;
      }
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });

  // Get group payment for a specific group
  const getGroupPayment = (groupId: string) => {
    return useQuery({
      queryKey: ['groupPayment', groupId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('group_payments')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return data as GroupPayment | null;
      },
      enabled: !!groupId && !!user,
    });
  };

  // Get member payments for a group
  const getMemberPayments = (groupId: string) => {
    return useQuery({
      queryKey: ['memberPayments', groupId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('member_payments')
          .select(`
            *,
            group_payments!inner (
              group_id
            )
          `)
          .eq('group_payments.group_id', groupId);

        if (error) throw error;
        return data as MemberPayment[];
      },
      enabled: !!groupId && !!user,
    });
  };

  // Get user's payment status for a group
  const getUserPaymentStatus = (groupId: string) => {
    return useQuery({
      queryKey: ['userPaymentStatus', groupId, user?.id],
      queryFn: async () => {
        if (!user) return null;

        const { data, error } = await supabase
          .from('member_payments')
          .select(`
            *,
            group_payments!inner (
              group_id
            )
          `)
          .eq('group_payments.group_id', groupId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        return data as MemberPayment | null;
      },
      enabled: !!groupId && !!user,
    });
  };

  // Create payment session
  const createPayment = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('create-group-payment', {
        body: { groupId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Open payment in new tab
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du paiement: ' + error.message);
    },
  });

  // Verify payments
  const verifyPayments = useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.functions.invoke('verify-group-payments', {
        body: { groupId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, groupId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['groupPayment', groupId] });
      queryClient.invalidateQueries({ queryKey: ['memberPayments', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userPaymentStatus', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });

      if (data.allPaid) {
        toast.success('Tous les membres ont payé ! Le bar va être assigné.');
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la vérification des paiements: ' + error.message);
    },
  });

  return {
    ppuConfig,
    isLoadingConfig,
    getGroupPayment,
    getMemberPayments,
    getUserPaymentStatus,
    createPayment,
    verifyPayments,
    isPpuEnabled: ppuConfig?.enabled || false,
    ppuPrice: ppuConfig?.priceEur || 0.99,
  };
};