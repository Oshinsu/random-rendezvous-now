import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ABTest {
  id: string;
  campaign_id: string;
  test_name: string;
  variant_a_subject: string;
  variant_b_subject: string;
  variant_a_content: string;
  variant_b_content: string;
  variant_a_sends: number;
  variant_b_sends: number;
  variant_a_opens: number;
  variant_b_opens: number;
  variant_a_clicks: number;
  variant_b_clicks: number;
  variant_a_conversions: number;
  variant_b_conversions: number;
  winner?: 'A' | 'B' | null;
  status: 'draft' | 'running' | 'completed';
  created_at: string;
}

export const useABTesting = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTests((data || []) as ABTest[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching A/B tests:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createABTest = async (
    campaignId: string,
    testName: string,
    variantASubject: string,
    variantBSubject: string,
    variantAContent: string,
    variantBContent: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .insert([{
          campaign_id: campaignId,
          test_name: testName,
          variant_a_subject: variantASubject,
          variant_b_subject: variantBSubject,
          variant_a_content: variantAContent,
          variant_b_content: variantBContent,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Test A/B créé',
        description: 'Le test A/B a été créé avec succès'
      });

      await fetchTests();
      return data;
    } catch (err) {
      console.error('Error creating A/B test:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le test A/B',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateTestStatus = async (testId: string, status: ABTest['status']) => {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({ status })
        .eq('id', testId);

      if (error) throw error;

      await fetchTests();
    } catch (err) {
      console.error('Error updating test status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return { tests, loading, error, createABTest, updateTestStatus, refetch: fetchTests };
};
