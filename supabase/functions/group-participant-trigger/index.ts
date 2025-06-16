
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { table, record, old_record } = await req.json()
    
    // Vérifier que c'est bien la table group_participants
    if (table !== 'group_participants') {
      return new Response('OK', { status: 200 })
    }

    console.log('🔄 Trigger groupe participants:', { table, record, old_record });

    // Calculer le nouveau nombre de participants confirmés
    const groupId = record?.group_id || old_record?.group_id;
    if (!groupId) {
      return new Response('OK', { status: 200 })
    }

    // Utiliser la connexion Supabase pour compter les participants actifs
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Compter les participants confirmés actuels
    const countResponse = await fetch(`${supabaseUrl}/rest/v1/group_participants?group_id=eq.${groupId}&status=eq.confirmed&select=id`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    const participants = await countResponse.json();
    const currentCount = Array.isArray(participants) ? participants.length : 0;

    console.log(`📊 Groupe ${groupId}: ${currentCount} participants confirmés`);

    // Récupérer l'état actuel du groupe
    const groupResponse = await fetch(`${supabaseUrl}/rest/v1/groups?id=eq.${groupId}&select=current_participants,status,bar_name,latitude,longitude`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    const groups = await groupResponse.json();
    const group = Array.isArray(groups) && groups.length > 0 ? groups[0] : null;

    if (!group) {
      console.log('⚠️ Groupe non trouvé');
      return new Response('OK', { status: 200 })
    }

    // Déterminer le nouveau statut
    let newStatus = group.status;
    let updateData: any = { current_participants: currentCount };

    if (currentCount === 5 && group.status === 'waiting') {
      newStatus = 'confirmed';
      updateData.status = 'confirmed';
      console.log('🎉 Groupe complet ! Passage en confirmed');
    } else if (currentCount < 5 && group.status === 'confirmed' && !group.bar_name) {
      newStatus = 'waiting';
      updateData.status = 'waiting';
      console.log('⏳ Groupe incomplet, retour en waiting');
    }

    // Mettre à jour le groupe
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/groups?id=eq.${groupId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      console.error('❌ Erreur mise à jour groupe');
      return new Response('Error', { status: 500 })
    }

    // 🔥 ATTRIBUTION AUTOMATIQUE DE BAR SI GROUPE COMPLET
    if (currentCount === 5 && newStatus === 'confirmed' && !group.bar_name) {
      console.log('🤖 Déclenchement attribution automatique de bar...');
      
      try {
        const barAssignmentResponse = await fetch(`${supabaseUrl}/functions/v1/auto-assign-bar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            group_id: groupId,
            latitude: group.latitude,
            longitude: group.longitude
          })
        });

        if (barAssignmentResponse.ok) {
          const barData = await barAssignmentResponse.json();
          
          // Mettre à jour le groupe avec les informations du bar
          const barUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/groups?id=eq.${groupId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bar_name: barData.name,
              bar_address: barData.formatted_address,
              meeting_time: barData.meeting_time,
              bar_latitude: barData.geometry.location.lat,
              bar_longitude: barData.geometry.location.lng,
              bar_place_id: barData.place_id
            })
          });

          if (barUpdateResponse.ok) {
            console.log('✅ Bar assigné automatiquement:', barData.name);
            
            // Envoyer un message système
            await fetch(`${supabaseUrl}/rest/v1/group_messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                group_id: groupId,
                user_id: '00000000-0000-0000-0000-000000000000',
                message: `🍺 Votre groupe est complet ! Rendez-vous au ${barData.name} à ${new Date(barData.meeting_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
                is_system: true
              })
            });
          }
        }
      } catch (error) {
        console.error('❌ Erreur attribution automatique:', error);
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('❌ Erreur trigger:', error);
    return new Response('Error', { status: 500 })
  }
})
