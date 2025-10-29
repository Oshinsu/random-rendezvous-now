import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StripeMRRData {
  success: boolean;
  mrr: number;
  active_subscriptions: number;
  subscription_details?: Array<{
    subscription_id: string;
    customer_id: string;
    product_id: string;
    amount: number;
    interval: string;
    monthly_contribution: number;
    quantity: number;
    status: string;
  }>;
  currency: string;
  calculated_at: string;
  error?: string;
}

export const useStripeMRR = () => {
  return useQuery({
    queryKey: ['stripeMRR'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<StripeMRRData>('get-stripe-mrr');
      
      if (error) {
        console.error('Error fetching Stripe MRR:', error);
        throw error;
      }
      
      return data;
    },
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    // Retry on failure
    retry: 2,
    retryDelay: 1000
  });
};
