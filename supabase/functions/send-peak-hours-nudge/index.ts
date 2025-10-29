import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { day, hour } = await req.json();
    console.log(`🔔 Starting peak-hours-nudge for ${day} at ${hour}h...`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les segments cibles: dormant_users et off_peak_users
    const { data: targetSegments, error: segmentsError } = await supabase
      .from('crm_user_segments')
      .select('id')
      .in('segment_key', ['dormant_users', 'off_peak_users']);

    if (segmentsError) {
      console.error('❌ Error fetching target segments:', segmentsError);
      throw segmentsError;
    }

    const segmentIds = targetSegments?.map(s => s.id) || [];
    console.log(`🎯 Target segments: ${segmentIds.length}`);

    if (segmentIds.length === 0) {
      console.warn('⚠️ No target segments found');
      return new Response(
        JSON.stringify({ success: true, message: 'No target segments found', sentCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les utilisateurs dans ces segments
    const { data: targetUsers, error: usersError } = await supabase
      .from('crm_user_segment_memberships')
      .select('user_id, profiles!inner(first_name, email)')
      .in('segment_id', segmentIds);

    if (usersError) {
      console.error('❌ Error fetching target users:', usersError);
      throw usersError;
    }

    console.log(`👥 Found ${targetUsers?.length || 0} target users`);

    // Récupérer quelques données temps réel pour personnalisation
    const { data: activeGroups } = await supabase
      .from('groups')
      .select('id, location_name, current_participants')
      .eq('status', 'waiting')
      .gte('current_participants', 2)
      .limit(5);

    const activeGroupsCount = activeGroups?.length || 0;
    const popularLocations = activeGroups?.slice(0, 3).map(g => g.location_name).filter(Boolean) || [];

    let sentCount = 0;
    let failedCount = 0;

    for (const userRecord of targetUsers || []) {
      try {
        const user = userRecord.profiles;
        const firstName = user?.first_name || 'ami';

        // Contenu personnalisé avec données temps réel
        const content = `
🌟 Salut ${firstName} !

C'est l'heure de sortir ! ${activeGroupsCount > 0 ? `Il y a déjà ${activeGroupsCount} groupes actifs près de toi` : 'Sois le premier à créer un groupe ce soir'} 🎉

${popularLocations.length > 0 ? `🔥 Lieux populaires ce soir:\n${popularLocations.map(loc => `• ${loc}`).join('\n')}` : ''}

💡 Astuce: Les groupes se remplissent en moyenne en 15 min le ${day === 'thursday' ? 'jeudi' : day === 'friday' ? 'vendredi' : 'samedi'} soir !

👉 Crée ou rejoins un groupe maintenant
        `.trim();

        // Créer notification in-app
        const { error: notifError } = await supabase.rpc('create_in_app_notification', {
          target_user_id: userRecord.user_id,
          notif_type: 'peak_hours_nudge',
          notif_title: `🎉 C'est l'heure de sortir !`,
          notif_body: `${activeGroupsCount > 0 ? `${activeGroupsCount} groupes actifs` : 'Crée un groupe'} près de toi maintenant`,
          notif_data: {
            day,
            hour,
            activeGroupsCount,
            popularLocations
          },
          notif_action_url: '/dashboard',
          notif_icon: 'https://api.iconify.design/mdi:bell-ring.svg'
        });

        if (notifError) {
          console.error(`❌ Error creating notification for user ${userRecord.user_id}:`, notifError);
          failedCount++;
        } else {
          console.log(`✅ Sent peak hours nudge to user ${userRecord.user_id}`);
          sentCount++;
        }

        // TODO: Envoyer aussi push notification si l'utilisateur a activé les notifications push
        // Nécessiterait une table user_push_tokens et l'appel à send-push-notification

      } catch (error) {
        console.error(`❌ Error processing user ${userRecord.user_id}:`, error);
        failedCount++;
      }
    }

    console.log(`✅ Peak hours nudge complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        day,
        hour,
        targetUsersCount: targetUsers?.length || 0,
        sentCount,
        failedCount,
        activeGroupsCount,
        popularLocations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-peak-hours-nudge:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});