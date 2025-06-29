
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

// Fonction de mise à jour atomique avec verrouillage
async function updateGroupWithBar(groupId: string, barData: any): Promise<boolean> {
  try {
    const meetingTime = new Date(Date.now() + 60 * 60 * 1000);
    
    // Mise à jour atomique avec conditions strictes
    const { error: updateError } = await supabase
      .from('groups')
      .update({
        bar_name: barData.name,
        bar_address: barData.formatted_address,
        meeting_time: meetingTime.toISOString(),
        bar_latitude: barData.geometry.location.lat,
        bar_longitude: barData.geometry.location.lng,
        bar_place_id: barData.place_id
      })
      .eq('id', groupId)
      .eq('status', 'confirmed')
      .eq('current_participants', 5)
      .is('bar_name', null);

    if (updateError) {
      console.error('❌ [TRIGGER] Erreur mise à jour atomique:', updateError);
      return false;
    }

    // Message de confirmation avec formatage uniforme
    await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: '00000000-0000-0000-0000-000000000000',
        message: `🍺 Votre groupe est complet ! Rendez-vous au ${barData.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        is_system: true
      });

    return true;
  } catch (error) {
    console.error('❌ [TRIGGER] Erreur dans updateGroupWithBar:', error);
    return false;
  }
}

serve(async (req) => {
  try {
    const { table, record, old_record } = await req.json()
    
    console.log('🔄 [TRIGGER] Webhook reçu:', { 
      table, 
      recordId: record?.id, 
      message: record?.message?.substring(0, 50) 
    });

    // Gérer uniquement les messages de déclenchement automatique
    if (table === 'group_messages' && 
        record?.is_system && 
        record?.message === 'AUTO_BAR_ASSIGNMENT_TRIGGER') {
      
      const groupId = record.group_id;
      console.log('🤖 [TRIGGER] Déclenchement attribution pour groupe:', groupId);

      try {
        // Vérification immédiate de l'éligibilité avec verrouillage
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('id, latitude, longitude, current_participants, status, bar_name, bar_place_id')
          .eq('id', groupId)
          .single();

        if (groupError || !group) {
          console.error('❌ [TRIGGER] Groupe introuvable:', groupError);
          await supabase.from('group_messages').delete().eq('id', record.id);
          return new Response('OK', { status: 200 })
        }

        // Vérifications d'éligibilité STRICTES
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
            hasBar: !!group.bar_name
          });
          
          // Nettoyage immédiat du message de déclenchement
          await supabase.from('group_messages').delete().eq('id', record.id);
          return new Response('OK', { status: 200 })
        }

        console.log('🎯 [TRIGGER] Appel Edge Function auto-assign-bar...');

        // Appel de l'Edge Function avec gestion d'erreur robuste
        const { data: barResponse, error: barError } = await supabase.functions.invoke('auto-assign-bar', {
          body: {
            group_id: groupId,
            latitude: group.latitude,
            longitude: group.longitude
          }
        });

        if (barError) {
          console.error('❌ [TRIGGER] Erreur appel auto-assign-bar:', barError);
          
          // Message d'échec avec nettoyage
          await supabase
            .from('group_messages')
            .insert({
              group_id: groupId,
              user_id: '00000000-0000-0000-0000-000000000000',
              message: '⚠️ Erreur lors de la recherche automatique de bar. Réessayez manuellement.',
              is_system: true
            });
            
          await supabase.from('group_messages').delete().eq('id', record.id);
          return new Response('OK', { status: 200 })
        }

        // Traitement de la réponse standardisée
        if (barResponse?.success && barResponse?.bar) {
          console.log('✅ [TRIGGER] Bar reçu:', barResponse.bar.name);
          
          const success = await updateGroupWithBar(groupId, barResponse.bar);
          
          if (!success) {
            // Fallback en cas d'échec de mise à jour
            await supabase
              .from('group_messages')
              .insert({
                group_id: groupId,
                user_id: '00000000-0000-0000-0000-000000000000',
                message: '⚠️ Erreur lors de l\'attribution du bar. Veuillez choisir manuellement.',
                is_system: true
              });
          }
        } else {
          console.log('⚠️ [TRIGGER] Aucun bar trouvé par auto-assign-bar');
          
          // Message d'information pour recherche manuelle
          await supabase
            .from('group_messages')
            .insert({
              group_id: groupId,
              user_id: '00000000-0000-0000-0000-000000000000',
              message: '⚠️ Aucun bar disponible trouvé automatiquement. Vous pouvez choisir un lieu manuellement.',
              is_system: true
            });
        }

        // Nettoyage SYSTÉMATIQUE du message de déclenchement
        await supabase.from('group_messages').delete().eq('id', record.id);
        
        console.log('✅ [TRIGGER] Attribution automatique terminée et nettoyée');
        
      } catch (error) {
        console.error('❌ [TRIGGER] Erreur dans le traitement:', error);
        
        // Nettoyage en cas d'erreur + message d'erreur
        await Promise.all([
          supabase.from('group_messages').delete().eq('id', record.id),
          supabase
            .from('group_messages')
            .insert({
              group_id: groupId,
              user_id: '00000000-0000-0000-0000-000000000000',
              message: '⚠️ Erreur technique lors de l\'attribution automatique. Réessayez.',
              is_system: true
            })
        ]);
      }

      return new Response('OK', { status: 200 })
    }

    // Autres types de webhooks
    return new Response('OK', { status: 200 })
    
  } catch (error) {
    console.error('❌ [TRIGGER] Erreur globale:', error);
    return new Response('Error', { status: 500 })
  }
})
