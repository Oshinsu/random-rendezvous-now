
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
    
    console.log('🔄 [TRIGGER] Webhook reçu:', { 
      table, 
      recordId: record?.id, 
      message: record?.message?.substring(0, 50) 
    });

    // Gérer les messages de déclenchement d'attribution automatique
    if (table === 'group_messages' && 
        record?.is_system && 
        record?.message === 'AUTO_BAR_ASSIGNMENT_TRIGGER') {
      
      const groupId = record.group_id;
      console.log('🤖 [TRIGGER] Déclenchement attribution automatique pour groupe:', groupId);

      try {
        // 1. Vérifier immédiatement l'éligibilité du groupe
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('id, latitude, longitude, current_participants, status, bar_name, bar_place_id')
          .eq('id', groupId)
          .single();

        if (groupError) {
          console.error('❌ [TRIGGER] Erreur récupération groupe:', groupError);
          return new Response('OK', { status: 200 })
        }

        if (!group) {
          console.error('❌ [TRIGGER] Groupe introuvable:', groupId);
          return new Response('OK', { status: 200 })
        }

        // 2. Vérifications d'éligibilité
        const isEligible = (
          group.current_participants === 5 &&
          group.status === 'confirmed' &&
          !group.bar_name &&
          !group.bar_place_id
        );

        if (!isEligible) {
          console.log('ℹ️ [TRIGGER] Groupe non éligible:', {
            participants: group.current_participants,
            status: group.status,
            hasBar: !!group.bar_name,
            hasPlaceId: !!group.bar_place_id
          });
          
          // Nettoyer le message de déclenchement
          await supabase
            .from('group_messages')
            .delete()
            .eq('id', record.id);
            
          return new Response('OK', { status: 200 })
        }

        console.log('🎯 [TRIGGER] Appel Edge Function auto-assign-bar...');

        // 3. Appeler l'Edge Function auto-assign-bar
        const { data: barData, error: barError } = await supabase.functions.invoke('auto-assign-bar', {
          body: {
            group_id: groupId,
            latitude: group.latitude,
            longitude: group.longitude
          }
        });

        if (barError) {
          console.error('❌ [TRIGGER] Erreur appel auto-assign-bar:', barError);
          return new Response('OK', { status: 200 })
        }

        if (barData && barData.success && barData.bar) {
          console.log('✅ [TRIGGER] Bar assigné:', barData.bar.name);
          
          // 4. Mettre à jour le groupe avec les informations du bar
          const meetingTime = new Date(Date.now() + 60 * 60 * 1000);
          
          const { error: updateError } = await supabase
            .from('groups')
            .update({
              bar_name: barData.bar.name,
              bar_address: barData.bar.formatted_address,
              meeting_time: meetingTime.toISOString(),
              bar_latitude: barData.bar.geometry.location.lat,
              bar_longitude: barData.bar.geometry.location.lng,
              bar_place_id: barData.bar.place_id
            })
            .eq('id', groupId)
            .eq('status', 'confirmed')
            .is('bar_name', null);

          if (updateError) {
            console.error('❌ [TRIGGER] Erreur mise à jour groupe:', updateError);
          } else {
            console.log('✅ [TRIGGER] Groupe mis à jour avec succès');
            
            // 5. Envoyer message de confirmation
            await supabase
              .from('group_messages')
              .insert({
                group_id: groupId,
                user_id: '00000000-0000-0000-0000-000000000000',
                message: `🍺 Votre groupe est complet ! Rendez-vous au ${barData.bar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                is_system: true
              });
          }
        } else {
          console.log('⚠️ [TRIGGER] Aucun bar trouvé par auto-assign-bar');
          
          // Envoyer message d'échec
          await supabase
            .from('group_messages')
            .insert({
              group_id: groupId,
              user_id: '00000000-0000-0000-0000-000000000000',
              message: '⚠️ Aucun bar disponible trouvé automatiquement. Vous pouvez choisir un lieu manuellement.',
              is_system: true
            });
        }

        // 6. Nettoyer le message de déclenchement
        await supabase
          .from('group_messages')
          .delete()
          .eq('id', record.id);

        console.log('✅ [TRIGGER] Attribution automatique terminée');
      } catch (error) {
        console.error('❌ [TRIGGER] Erreur attribution automatique:', error);
      }

      return new Response('OK', { status: 200 })
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('❌ [TRIGGER] Erreur globale:', error);
    return new Response('Error', { status: 500 })
  }
})
