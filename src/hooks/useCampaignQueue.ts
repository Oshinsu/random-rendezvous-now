import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueueData {
  campaignId: string;
  processed: number;
  total: number;
  failed: number;
  status: 'pending' | 'sending' | 'completed';
  created_at: number;
}

export function useCampaignQueue() {
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueues = async () => {
    try {
      // Call edge function to read from Deno KV
      const { data, error } = await supabase.functions.invoke('get-campaign-queues');
      
      if (error) {
        console.error('Error fetching queues:', error);
        return;
      }

      setQueues(data?.queues || []);
    } catch (error) {
      console.error('Error in useCampaignQueue:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();

    // Refresh every 10 seconds
    const interval = setInterval(fetchQueues, 10000);

    return () => clearInterval(interval);
  }, []);

  return { queues, loading, refetch: fetchQueues };
}
