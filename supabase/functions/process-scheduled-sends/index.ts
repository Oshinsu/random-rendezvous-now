import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📬 Starting process-scheduled-sends cron job...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les envois planifiés dont l'heure est arrivée
    const { data: scheduledSends, error: fetchError } = await supabase
      .from('crm_scheduled_sends')
      .select('*, campaign:crm_campaigns(campaign_name, content, subject, channels)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(100); // Process max 100 at a time

    if (fetchError) {
      console.error('❌ Error fetching scheduled sends:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${scheduledSends?.length || 0} scheduled sends to process`);

    let successCount = 0;
    let failedCount = 0;

    for (const scheduledSend of scheduledSends || []) {
      try {
        console.log(`📤 Processing scheduled send ${scheduledSend.id} for user ${scheduledSend.user_id}`);

        // Appeler send-lifecycle-campaign pour envoyer la campagne
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-lifecycle-campaign', {
          body: {
            campaignId: scheduledSend.campaign_id,
            specificUserId: scheduledSend.user_id, // Envoyer seulement à cet utilisateur
            source: 'scheduled-send',
            scheduledSendId: scheduledSend.id
          }
        });

        if (sendError) {
          console.error(`❌ Error sending campaign for scheduled send ${scheduledSend.id}:`, sendError);
          
          // Marquer comme failed
          await supabase
            .from('crm_scheduled_sends')
            .update({
              status: 'failed',
              error_message: sendError.message || 'Unknown error',
              sent_at: new Date().toISOString()
            })
            .eq('id', scheduledSend.id);
          
          failedCount++;
        } else {
          console.log(`✅ Successfully sent campaign for scheduled send ${scheduledSend.id}`);
          
          // Marquer comme sent
          await supabase
            .from('crm_scheduled_sends')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', scheduledSend.id);
          
          successCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing scheduled send ${scheduledSend.id}:`, error);
        
        await supabase
          .from('crm_scheduled_sends')
          .update({
            status: 'failed',
            error_message: (error instanceof Error ? error.message : String(error)) || 'Unknown error',
            sent_at: new Date().toISOString()
          })
          .eq('id', scheduledSend.id);
        
        failedCount++;
      }
    }

    console.log(`✅ Process complete: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed: scheduledSends?.length || 0,
        successCount,
        failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in process-scheduled-sends:', error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});