import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { segment_id, user_id } = await req.json();

    // Fetch user's historical open times
    let openHours: number[] = [];
    
    if (user_id) {
      const { data: userSends } = await supabaseClient
        .from('crm_campaign_sends')
        .select('opened_at')
        .eq('user_id', user_id)
        .not('opened_at', 'is', null);

      if (userSends && userSends.length > 0) {
        openHours = userSends.map(s => new Date(s.opened_at!).getHours());
      }
    }

    // Fallback to segment stats if no user history
    if (openHours.length === 0 && segment_id) {
      const { data: segmentUsers } = await supabaseClient
        .from('crm_user_segment_memberships')
        .select('user_id')
        .eq('segment_id', segment_id);

      if (segmentUsers && segmentUsers.length > 0) {
        const userIds = segmentUsers.map(u => u.user_id);
        const { data: segmentSends } = await supabaseClient
          .from('crm_campaign_sends')
          .select('opened_at')
          .in('user_id', userIds)
          .not('opened_at', 'is', null)
          .limit(500);

        if (segmentSends && segmentSends.length > 0) {
          openHours = segmentSends.map(s => new Date(s.opened_at!).getHours());
        }
      }
    }

    // Calculate optimal hour
    let recommendedHour = 17; // Default
    let estimatedOpenRate = 25; // Default %
    let confidence = 'low';

    if (openHours.length > 0) {
      // Calculate frequency distribution
      const hourCounts: Record<number, number> = {};
      openHours.forEach(h => {
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });

      // Find peak hour
      recommendedHour = parseInt(
        Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)[0][0]
      );

      // Calculate estimated open rate based on data density
      const maxCount = Math.max(...Object.values(hourCounts));
      estimatedOpenRate = Math.min(Math.round((maxCount / openHours.length) * 100 * 1.5), 65);
      
      confidence = openHours.length > 20 ? 'high' : openHours.length > 5 ? 'medium' : 'low';
    }

    // Recommend day (Thursday is statistically best for engagement)
    const recommendedDay = 4; // Thursday (0=Sunday)

    return new Response(
      JSON.stringify({
        recommended_hour: recommendedHour,
        recommended_day: recommendedDay,
        estimated_open_rate: estimatedOpenRate,
        confidence,
        data_points: openHours.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error optimizing send time:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});