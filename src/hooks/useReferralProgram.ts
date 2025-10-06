import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Referral {
  id: string;
  referral_code: string;
  referred_user_id: string | null;
  status: string;
  reward_amount: number;
  reward_given_at: string | null;
  converted_at: string | null;
  created_at: string;
  metadata: any;
}

export const useReferralProgram = () => {
  const { user } = useAuth();
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateReferralCode = (userId: string): string => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RND-${randomPart}`;
  };

  const fetchReferralData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Check if user has a referral code
      const { data: existingReferrals, error: fetchError } = await supabase
        .from('crm_referrals')
        .select('*')
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!existingReferrals || existingReferrals.length === 0) {
        // Create first referral code for user
        const newCode = generateReferralCode(user.id);
        
        const { data: newReferral, error: createError } = await supabase
          .from('crm_referrals')
          .insert({
            referrer_user_id: user.id,
            referral_code: newCode,
            status: 'pending',
            reward_amount: 0,
          })
          .select()
          .single();

        if (createError) throw createError;

        setMyReferralCode(newCode);
        setReferrals([newReferral]);
      } else {
        // Get the most recent code
        const activeCode = existingReferrals[0].referral_code;
        setMyReferralCode(activeCode);
        setReferrals(existingReferrals);

        // Calculate total rewards
        const total = existingReferrals
          .filter(r => r.status === 'rewarded')
          .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
        setTotalRewards(total);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching referral data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Find referral by code
      const { data: referral, error: findError } = await supabase
        .from('crm_referrals')
        .select('*')
        .eq('referral_code', code)
        .eq('status', 'pending')
        .single();

      if (findError || !referral) {
        throw new Error('Invalid or expired referral code');
      }

      // Can't refer yourself
      if (referral.referrer_user_id === user.id) {
        throw new Error('You cannot use your own referral code');
      }

      // Update referral with referred user
      const { error: updateError } = await supabase
        .from('crm_referrals')
        .update({
          referred_user_id: user.id,
          status: 'converted',
          converted_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      if (updateError) throw updateError;

      return { success: true, message: 'Referral code applied successfully!' };
    } catch (err) {
      console.error('Error applying referral code:', err);
      throw err;
    }
  };

  const shareReferralLink = () => {
    if (!myReferralCode) return;

    const referralLink = `https://randomapp.fr/signup?ref=${myReferralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Rejoins-moi sur Random !',
        text: `Utilise mon code de parrainage ${myReferralCode} et reçois un bonus de bienvenue !`,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      return referralLink;
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [user?.id]);

  return {
    myReferralCode,
    referrals,
    totalRewards,
    loading,
    error,
    refetch: fetchReferralData,
    applyReferralCode,
    shareReferralLink,
  };
};
