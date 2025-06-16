
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

serve(async (req) => {
  try {
    const { table, record, old_record } = await req.json()
    
    console.log('🔄 Trigger webhook reçu:', { table, record: record ? { id: record.id, message: record.message } : null });

    // Gérer les messages système pour l'attribution automatique de bar
    if (table === 'group_messages' && record?.is_system && record?.message === 'AUTO_BAR_ASSIGNMENT_TRIGGER') {
      const groupId = record.group_id;
      console.log('🤖 Déclenchement automatique d\'attribution de bar pour le groupe:', groupId);

      try {
        // Récupérer les informations du groupe
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('latitude, longitude, current_participants, status, bar_name')
          .eq('id', groupId)
          .single();

        if (groupError) {
          console.error('❌ Erreur récupération groupe:', groupError);
          return new Response('OK', { status: 200 })
        }

        // Vérifier que le groupe est éligible
        if (group.current_participants !== 5 || group.status !== 'confirmed' || group.bar_name) {
          console.log('ℹ️ Groupe non éligible pour attribution automatique:', {
            participants: group.current_participants,
            status: group.status,
            hasBar: !!group.bar_name
          });
          return new Response('OK', { status: 200 })
        }

        console.log('🎯 Appel de l\'Edge Function auto-assign-bar...');

        // Appeler l'Edge Function auto-assign-bar
        const { data: barData, error: barError } = await supabase.functions.invoke('auto-assign-bar', {
          body: {
            group_id: groupId,
            latitude: group.latitude,
            longitude: group.longitude
          }
        });

        if (barError) {
          console.error('❌ Erreur appel auto-assign-bar:', barError);
          return new Response('OK', { status: 200 })
        }

        if (barData && barData.name) {
          console.log('✅ Réponse de auto-assign-bar:', barData.name);
          
          // Mettre à jour le groupe avec les informations du bar
          const { error: updateError } = await supabase
            .from('groups')
            .update({
              bar_name: barData.name,
              bar_address: barData.formatted_address,
              meeting_time: barData.meeting_time,
              bar_latitude: barData.geometry.location.lat,
              bar_longitude: barData.geometry.location.lng,
              bar_place_id: barData.place_id
            })
            .eq('id', groupId);

          if (updateError) {
            console.error('❌ Erreur mise à jour groupe:', updateError);
            return new Response('OK', { status: 200 })
          }

          console.log('✅ Groupe mis à jour avec les informations du bar');
          
          // Supprimer le message de déclenchement
          await supabase
            .from('group_messages')
            .delete()
            .eq('group_id', groupId)
            .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER');

          // Envoyer un message système informatif
          await supabase
            .from('group_messages')
            .insert({
              group_id: groupId,
              user_id: '00000000-0000-0000-0000-000000000000',
              message: `🍺 Votre groupe est complet ! Rendez-vous au ${barData.name} à ${new Date(barData.meeting_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              is_system: true
            });

          console.log('✅ Attribution automatique terminée avec succès');
        } else {
          console.log('⚠️ Aucune donnée de bar reçue de auto-assign-bar');
        }
      } catch (error) {
        console.error('❌ Erreur attribution automatique:', error);
      }

      return new Response('OK', { status: 200 })
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('❌ Erreur trigger:', error);
    return new Response('Error', { status: 500 })
  }
})
