import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ABTest {
  id: string;
  campaign_id: string;
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_sends: number;
  variant_b_sends: number;
  variant_a_opens: number;
  variant_b_opens: number;
  variant_a_clicks: number;
  variant_b_clicks: number;
  winner?: 'A' | 'B' | null;
  status: 'running' | 'completed';
}

export const useABTesting = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  const createABTest = async (campaignId: string, variantASubject: string, variantBSubject: string) => {
    try {
      // Get campaign sends for this campaign
      const { data: sends } = await supabase
        .from('crm_campaign_sends')
        .select('*')
        .eq('campaign_id', campaignId);

      if (!sends) return;

      // Split sends into two groups
      const halfPoint = Math.floor(sends.length / 2);
      const variantASends = sends.slice(0, halfPoint);
      const variantBSends = sends.slice(halfPoint);

      const variantAOpens = variantASends.filter(s => s.opened_at).length;
      const variantBOpens = variantBSends.filter(s => s.opened_at).length;
      const variantAClicks = variantASends.filter(s => s.clicked_at).length;
      const variantBClicks = variantBSends.filter(s => s.clicked_at).length;

      const variantAOpenRate = variantASends.length > 0 ? (variantAOpens / variantASends.length) * 100 : 0;
      const variantBOpenRate = variantBSends.length > 0 ? (variantBOpens / variantBSends.length) * 100 : 0;

      const winner = variantAOpenRate > variantBOpenRate ? 'A' : 'B';

      const test: ABTest = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        variant_a_subject: variantASubject,
        variant_b_subject: variantBSubject,
        variant_a_sends: variantASends.length,
        variant_b_sends: variantBSends.length,
        variant_a_opens: variantAOpens,
        variant_b_opens: variantBOpens,
        variant_a_clicks: variantAClicks,
        variant_b_clicks: variantBClicks,
        winner: winner,
        status: 'completed'
      };

      setTests(prev => [...prev, test]);
      return test;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    // Mock data for now - in production, this would query a real ab_tests table
    const mockTests: ABTest[] = [
      {
        id: '1',
        campaign_id: 'camp-1',
        variant_a_subject: 'Rejoignez-nous ce soir !',
        variant_b_subject: '🎉 Soirée Random ce soir ?',
        variant_a_sends: 500,
        variant_b_sends: 500,
        variant_a_opens: 150,
        variant_b_opens: 220,
        variant_a_clicks: 45,
        variant_b_clicks: 78,
        winner: 'B',
        status: 'completed'
      }
    ];
    setTests(mockTests);
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return { tests, loading, createABTest, refetch: fetchTests };
};
