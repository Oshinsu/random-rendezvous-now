import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StripeSubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  subscription_end?: string;
}

export const useBarSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check subscription status with Stripe
  const { data: subscriptionStatus, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['barStripeSubscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase.functions.invoke('check-bar-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      return data as StripeSubscriptionStatus;
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // 5 minutes - optimisé
  });

  // Create checkout session
  const createCheckout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('create-bar-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création de la session de paiement: ' + error.message);
    },
  });

  // Manage subscription (customer portal)
  const manageSubscription = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('bar-customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Open Stripe Customer Portal in new tab
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'ouverture du portail client: ' + error.message);
    },
  });

  // Auto-refresh subscription status on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        refetchSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refetchSubscription]);

  return {
    subscriptionStatus,
    isLoadingSubscription,
    createCheckout,
    manageSubscription,
    refetchSubscription,
    isSubscribed: subscriptionStatus?.subscribed || false,
    subscriptionEnd: subscriptionStatus?.subscription_end,
    productId: subscriptionStatus?.product_id,
  };
};