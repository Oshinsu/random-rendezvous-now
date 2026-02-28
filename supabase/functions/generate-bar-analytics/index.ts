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

    console.log('Starting bar analytics generation job...');

    // Get all approved bar owners
    const { data: barOwners, error: ownersError } = await supabaseClient
      .from('bar_owners')
      .select('id, bar_place_id, bar_name')
      .eq('status', 'approved')
      .not('bar_place_id', 'is', null);

    if (ownersError) {
      throw ownersError;
    }

    console.log(`Found ${barOwners?.length || 0} bar owners to process`);

    if (!barOwners || barOwners.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bar owners to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Current month (first day)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    let processedCount = 0;
    let errorCount = 0;

    for (const barOwner of barOwners) {
      try {
        // Check if report already exists for this month
        const { data: existingReport } = await supabaseClient
          .from('bar_analytics_reports')
          .select('id')
          .eq('bar_owner_id', barOwner.id)
          .eq('report_month', currentMonth.toISOString().split('T')[0])
          .maybeSingle();

        if (existingReport) {
          console.log(`Report already exists for bar owner ${barOwner.id}, skipping...`);
          continue;
        }

        // Generate analytics for this bar
        const startOfMonth = new Date(currentMonth);
        const endOfMonth = new Date(currentMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        // Get groups that went to this bar this month
        const { data: outings, error: outingsError } = await supabaseClient
          .from('user_outings_history')
          .select(`
            *,
            groups!inner(bar_place_id)
          `)
          .eq('groups.bar_place_id', barOwner.bar_place_id)
          .gte('completed_at', startOfMonth.toISOString())
          .lt('completed_at', endOfMonth.toISOString());

        if (outingsError) {
          console.error(`Error fetching outings for bar ${barOwner.id}:`, outingsError);
          errorCount++;
          continue;
        }

        const totalGroups = new Set(outings?.map(o => o.group_id) || []).size;
        const totalCustomers = outings?.reduce((sum, o) => sum + o.participants_count, 0) || 0;
        const estimatedRevenue = totalCustomers * 2500; // 25€ per customer in cents

        // Calculate peak hours and weekly breakdown
        const hourCounts: Record<number, number> = {};
        const weeklyBreakdown: Record<string, number> = {};

        outings?.forEach(outing => {
          const date = new Date(outing.meeting_time);
          const hour = date.getHours();
          const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' });

          hourCounts[hour] = (hourCounts[hour] || 0) + outing.participants_count;
          weeklyBreakdown[dayOfWeek] = (weeklyBreakdown[dayOfWeek] || 0) + outing.participants_count;
        });

        // Find peak hour
        const peakHour = Object.entries(hourCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0];

        const peakHourNumber = peakHour ? parseInt(peakHour.toString()) : 0;

        // Create analytics report
        const { error: insertError } = await supabaseClient
          .from('bar_analytics_reports')
          .insert({
            bar_owner_id: barOwner.id,
            report_month: currentMonth.toISOString().split('T')[0],
            total_groups: totalGroups,
            total_customers: totalCustomers,
            estimated_revenue_eur: estimatedRevenue,
            peak_hours: { peak_hour: peakHourNumber, hour_counts: hourCounts },
            weekly_breakdown: weeklyBreakdown,
          });

        if (insertError) {
          console.error(`Error inserting report for bar ${barOwner.id}:`, insertError);
          errorCount++;
        } else {
          processedCount++;
          console.log(`Generated report for ${barOwner.bar_name}: ${totalCustomers} customers, ${totalGroups} groups`);
        }

      } catch (error) {
        console.error(`Error processing bar owner ${barOwner.id}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      processed: processedCount,
      errors: errorCount,
      total_bars: barOwners.length,
      report_month: currentMonth.toISOString().split('T')[0],
    };

    console.log('Bar analytics generation completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in generate-bar-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});