import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook séparé pour la souscription Realtime GLOBALE
 * Écoute tous les triggers AUTO_BAR_ASSIGNMENT_TRIGGER pour l'utilisateur connecté
 * Indépendant de activeGroupId pour une détection instantanée
 */
export const useGlobalBarTriggers = () => {
  const { user } = useAuth();
  const processedTriggers = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;
    
    console.log('🌍 [REALTIME GLOBAL] Démarrage souscription globale pour user:', user.id);
    
    const globalChannel = supabase
      .channel(`user-triggers-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          // Pas de filtre group_id → écoute TOUS les messages système
        },
        (payload) => {
          const message = payload.new;
          
          console.log('🌍 [REALTIME GLOBAL] Message système reçu:', {
            group_id: message?.group_id,
            is_system: message?.is_system,
            message_type: message?.message
          });
          
          // Si c'est un trigger d'attribution de bar
          if (message?.is_system && message?.message === 'AUTO_BAR_ASSIGNMENT_TRIGGER') {
            console.log('🎯 [REALTIME GLOBAL] ✅ Trigger AUTO_BAR_ASSIGNMENT détecté!');
            
            const triggerGroupId = message.group_id;
            
            // Vérifier si l'utilisateur est dans ce groupe
            supabase
              .from('group_participants')
              .select('id')
              .eq('group_id', triggerGroupId)
              .eq('user_id', user.id)
              .eq('status', 'confirmed')
              .maybeSingle()
              .then(({ data }) => {
                if (!data) {
                  console.log('⏭️ [REALTIME GLOBAL] User pas dans ce groupe, ignore');
                  return;
                }
                
                console.log('✅ [REALTIME GLOBAL] User confirmé dans le groupe');
                
                // Protection anti-spam
                if (processedTriggers.current.has(message.id)) {
                  console.log('⏭️ [REALTIME GLOBAL] Trigger déjà traité, ignore:', message.id);
                  return;
                }
                
                processedTriggers.current.add(message.id);
                
                // Récupérer les coordonnées du groupe et appeler l'edge function
                supabase
                  .from('groups')
                  .select('latitude, longitude, bar_place_id')
                  .eq('id', triggerGroupId)
                  .single()
                  .then(({ data: groupData, error }) => {
                    if (error || !groupData) {
                      console.error('❌ [REALTIME GLOBAL] Erreur fetch groupe:', error);
                      processedTriggers.current.delete(message.id);
                      return;
                    }
                    
                    if (groupData.bar_place_id) {
                      console.log('⏭️ [REALTIME GLOBAL] Bar déjà assigné, ignore');
                      return;
                    }
                    
                    if (!groupData.latitude || !groupData.longitude) {
                      console.error('❌ [REALTIME GLOBAL] Coordonnées manquantes');
                      processedTriggers.current.delete(message.id);
                      return;
                    }
                    
                    console.log('🚀 [REALTIME GLOBAL] Invocation edge function...');
                    supabase.functions.invoke('simple-auto-assign-bar', {
                      body: {
                        group_id: triggerGroupId,
                        latitude: groupData.latitude,
                        longitude: groupData.longitude
                      }
                    }).then(({ data, error }) => {
                      if (error) {
                        console.error('❌ [REALTIME GLOBAL] Erreur edge function:', error);
                        processedTriggers.current.delete(message.id);
                      } else {
                        console.log('✅ [REALTIME GLOBAL] Edge function OK:', data);
                      }
                    });
                  });
              });
          }
        }
      )
      .subscribe((status) => {
        console.log('🌍 [REALTIME GLOBAL] Statut souscription:', status);
      });
    
    return () => {
      console.log('🌍 [REALTIME GLOBAL] Nettoyage souscription globale');
      supabase.removeChannel(globalChannel);
    };
  }, [user?.id]);
};
