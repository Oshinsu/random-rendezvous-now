import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { user_id, group_id } = await req.json();
    
    console.log('Checking referral credits for user:', user_id);

    // 1. Vérifier si c'est la première sortie de l'utilisateur
    const { count: outingCount } = await supabase
      .from('user_outings_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (outingCount !== 1) {
      console.log('Not first outing, no credits awarded. Count:', outingCount);
      return new Response(JSON.stringify({ 
        message: 'Not first outing, no credits awarded',
        outing_count: outingCount
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    // 2. Trouver le parrainage associé
    const { data: referral, error: referralError } = await supabase
      .from('crm_referrals')
      .select('*')
      .eq('referred_user_id', user_id)
      .eq('status', 'converted')
      .maybeSingle();

    if (referralError) {
      console.error('Error fetching referral:', referralError);
      throw referralError;
    }

    if (!referral) {
      console.log('No referral found for user');
      return new Response(JSON.stringify({ 
        message: 'No referral found' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      });
    }

    console.log('Found referral:', referral.id);

    // 3. Attribuer 1 crédit au PARRAIN et au FILLEUL
    const creditAmount = 1;

    // Attribuer au parrain
    const { error: referrerCreditError } = await supabase.rpc('add_user_credits', {
      target_user_id: referral.referrer_user_id,
      amount: creditAmount,
      transaction_type: 'earned',
      source: 'referral_reward',
      referral_id: referral.id,
      group_id: group_id
    });

    if (referrerCreditError) {
      console.error('Error adding referrer credits:', referrerCreditError);
      throw referrerCreditError;
    }

    // Attribuer au filleul
    const { error: refereeCreditError } = await supabase.rpc('add_user_credits', {
      target_user_id: user_id,
      amount: creditAmount,
      transaction_type: 'earned',
      source: 'referral_reward',
      referral_id: referral.id,
      group_id: group_id
    });

    if (refereeCreditError) {
      console.error('Error adding referee credits:', refereeCreditError);
      throw refereeCreditError;
    }

    console.log('Credits added successfully');

    // 4. Marquer le parrainage comme récompensé
    const { error: updateError } = await supabase
      .from('crm_referrals')
      .update({
        status: 'rewarded',
        reward_amount: creditAmount,
        reward_given_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateError) {
      console.error('Error updating referral status:', updateError);
      throw updateError;
    }

    console.log('Referral marked as rewarded');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Credits awarded to both users',
      referrer_user_id: referral.referrer_user_id,
      referred_user_id: user_id,
      credit_amount: creditAmount
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    console.error('Error in award-referral-credits:', error);
    return new Response(JSON.stringify({ 
      error: (error instanceof Error ? error.message : String(error)),
      details: error 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});
