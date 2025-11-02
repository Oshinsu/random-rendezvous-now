import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerateStoryRequest {
  story_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error('Admin access required');
    }

    const { story_id, action, rejection_reason }: ModerateStoryRequest = await req.json();

    if (!story_id || !action) {
      throw new Error('Missing required fields');
    }

    // Update story status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    };

    if (action === 'reject' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data: story, error: updateError } = await supabaseClient
      .from('community_stories')
      .update(updateData)
      .eq('id', story_id)
      .select('*, user_id')
      .single();

    if (updateError) throw updateError;

    // If approved, award credits to user
    if (action === 'approve') {
      const { error: creditError } = await supabaseClient.rpc('award_credits', {
        p_user_id: story.user_id,
        p_amount: 50,
        p_reason: 'Story approved',
        p_metadata: { story_id }
      });

      if (creditError) {
        console.error('Error awarding credits:', creditError);
      }

      console.log(`✅ Story approved and 50 credits awarded to user ${story.user_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        story,
        credits_awarded: action === 'approve' ? 50 : 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error moderating story:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
