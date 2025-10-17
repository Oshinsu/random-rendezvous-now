import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from '@/services/groupGeolocation';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { supabase } from '@/integrations/supabase/client';
// Nettoyage géré automatiquement par cleanup-groups edge function
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { ErrorHandler } from '@/utils/errorHandling';
import { showUniqueToast } from '@/utils/toastUtils';

import { CoordinateValidator } from '@/utils/coordinateValidation';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useUnifiedGroups = () => {
  const { user } = useAuth();
  const { trackGroupCreate, trackGroupJoin } = useAnalytics();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  // ✅ CORRECTION #3 : Protection anti-spam pour triggers de bar
  const processedTriggers = useRef(new Set<string>());
  
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData> | null>(null);
  const lastLocationTime = useRef<number>(0);

  // Cache de localisation simplifié
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    const now = Date.now();
    const locationCacheTime = 15 * 60 * 1000; // 15 minutes
    
    if (!forceRefresh && userLocation && (now - lastLocationTime.current) < locationCacheTime) {
      return userLocation;
    }

    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    isGettingLocation.current = true;
    locationPromise.current = GeolocationService.getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
        lastLocationTime.current = now;
        showUniqueToast(
          `Position détectée: ${location.locationName}`,
          "📍 Position actualisée"
        );
        return location;
      })
      .catch((error) => {
        ErrorHandler.logError('GEOLOCATION', error);
        showUniqueToast(
          'Géolocalisation indisponible - mode universel activé.',
          "📍 Géolocalisation indisponible"
        );
        return null;
      })
      .finally(() => {
        isGettingLocation.current = false;
        locationPromise.current = null;
      });

    return locationPromise.current;
  };

  // Récupération simplifiée des groupes
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) return [];

    try {
      const allParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      const validGroups = allParticipations.map(p => p.groups).filter(Boolean);

      if (validGroups.length > 0) {
        await UnifiedGroupService.updateUserLastSeen(validGroups[0].id, user.id);
        const members = await UnifiedGroupService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
      } else {
        setGroupMembers([]);
      }

      return validGroups;
    } catch (error) {
      ErrorHandler.logError('UNIFIED_FETCH_USER_GROUPS', error);
      return [];
    }
  };

  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['unifiedUserGroups', user?.id],
    queryFn: fetchUserGroups,
    enabled: !!user,
    refetchInterval: 10 * 60 * 1000, // ✅ REALTIME: Polling 10 min (fallback sécurité)
    staleTime: 5 * 60 * 1000, // ✅ REALTIME: Cache 5 min (évite refetchs inutiles)
    refetchOnMount: 'always',
    refetchOnWindowFocus: false, // ✅ REALTIME: Pas de refetch brutal (Realtime gère)
  });

  // Battement de cœur simplifié - 1 heure (aligné avec GROUP_CONSTANTS.HEARTBEAT_INTERVAL)
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL // ✅ Utilise la constante (1h)
  });

  // ✅ CORRECTION #1 : Détection des triggers existants au montage
  const checkExistingTriggers = async (groupId: string) => {
    if (!user) return;
    
    console.log('🔍 [TRIGGER MOUNT] Vérification triggers existants pour groupe:', groupId);
    
    try {
      // Chercher les triggers AUTO_BAR_ASSIGNMENT_TRIGGER créés il y a moins de 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: triggers, error: triggerError } = await supabase
        .from('group_messages')
        .select('id, group_id, created_at')
        .eq('group_id', groupId)
        .eq('is_system', true)
        .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('🔍 [TRIGGER MOUNT] Triggers trouvés:', triggers?.length || 0);
      
      if (triggerError) {
        console.error('❌ [TRIGGER MOUNT] Erreur recherche triggers:', triggerError);
        return;
      }
      
      if (!triggers || triggers.length === 0) {
        console.log('✅ [TRIGGER MOUNT] Aucun trigger en attente');
        return;
      }
      
      const trigger = triggers[0];
      
      // Vérifier si déjà traité
      if (processedTriggers.current.has(trigger.id)) {
        console.log('⏭️ [TRIGGER MOUNT] Trigger déjà traité:', trigger.id);
        return;
      }
      
      // Vérifier si le groupe a déjà un bar assigné
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('bar_name, bar_place_id, latitude, longitude')
        .eq('id', groupId)
        .single();
      
      if (groupError) {
        console.error('❌ [TRIGGER MOUNT] Erreur fetch groupe:', groupError);
        return;
      }
      
      if (groupData?.bar_place_id) {
        console.log('✅ [TRIGGER MOUNT] Bar déjà assigné:', groupData.bar_name);
        processedTriggers.current.add(trigger.id);
        return;
      }
      
      if (!groupData?.latitude || !groupData?.longitude) {
        console.error('❌ [TRIGGER MOUNT] Coordonnées manquantes pour le groupe');
        return;
      }
      
      // Marquer comme traité AVANT l'appel pour éviter les doublons
      processedTriggers.current.add(trigger.id);
      
      console.log('🎯 [TRIGGER MOUNT] Appel edge function pour trigger:', trigger.id);
      
      // Appeler l'edge function
      const { data, error: invokeError } = await supabase.functions.invoke('simple-auto-assign-bar', {
        body: {
          group_id: groupId,
          latitude: groupData.latitude,
          longitude: groupData.longitude
        }
      });
      
      if (invokeError) {
        console.error('❌ [TRIGGER MOUNT] Erreur invocation edge function:', invokeError);
        processedTriggers.current.delete(trigger.id); // Retirer en cas d'échec pour réessayer
      } else {
        console.log('✅ [TRIGGER MOUNT] Edge function appelée avec succès:', data);
      }
      
    } catch (error) {
      console.error('❌ [TRIGGER MOUNT] Erreur globale:', error);
    }
  };

  // ✅ CORRECTION #1 : useEffect pour vérifier les triggers au montage
  useEffect(() => {
    if (activeGroupId && user) {
      console.log('🚀 [TRIGGER MOUNT] Montage - vérification triggers...');
      checkExistingTriggers(activeGroupId);
    }
  }, [activeGroupId, user?.id]);

  // 🌍 SOUSCRIPTION REALTIME GLOBALE : Détection instantanée des triggers (indépendante de activeGroupId)
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

  // ✅ REALTIME LOCAL: Souscription aux changements de groupe ET participants (fallback sécurité)
  useEffect(() => {
    if (!activeGroupId || !user) {
      console.log('🔄 [REALTIME] ❌ Pas de souscription:', { activeGroupId, user: !!user });
      return;
    }

    console.log('🔄 [REALTIME] ✅ Souscription au groupe:', activeGroupId);
    console.log('🔄 [REALTIME] User ID:', user.id);

    // Canal unique pour écouter à la fois groups et group_participants
    const channel = supabase
      .channel(`group-updates-${activeGroupId}`)
      // Écouter les changements sur la table groups
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${activeGroupId}`,
        },
        (payload) => {
          console.log('🔄 [REALTIME] Groupe modifié:', payload);
          
          // ✅ Mise à jour INSTANTANÉE du cache (synchrone)
          if (payload.eventType === 'UPDATE' && payload.new) {
            queryClient.setQueryData(['unifiedUserGroups', user.id], (oldData: Group[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(group => 
                group.id === activeGroupId 
                  ? { ...group, ...payload.new }
                  : group
              );
            });
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['unifiedUserGroups', user.id], (oldData: Group[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.filter(group => group.id !== activeGroupId);
            });
          }
        }
      )
      // Écouter les changements sur la table group_participants
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_participants',
          filter: `group_id=eq.${activeGroupId}`,
        },
        (payload) => {
          console.log('🔄 [REALTIME] Participant modifié:', payload);
          
          // ✅ Mise à jour INSTANTANÉE du compteur (synchrone)
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['unifiedUserGroups', user.id], (oldData: Group[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(group => 
                group.id === activeGroupId 
                  ? { ...group, current_participants: group.current_participants + 1 }
                  : group
              );
            });
            window.dispatchEvent(new CustomEvent('group:member-joined'));
            showUniqueToast('Un nouveau membre a rejoint le groupe !', '✨ Nouveau membre');
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['unifiedUserGroups', user.id], (oldData: Group[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map(group => 
                group.id === activeGroupId 
                  ? { ...group, current_participants: Math.max(0, group.current_participants - 1) }
                  : group
              );
            });
          }
          
          // ✅ Refetch membres en ARRIÈRE-PLAN (sans bloquer UI)
          UnifiedGroupService.getGroupMembers(activeGroupId)
            .then(members => {
              setGroupMembers(members);
            })
            .catch(error => {
              console.error('Erreur refetch membres:', error);
            });
        }
      )
      // ✅ CORRECTION #2 : Écouter les triggers d'attribution de bar (SYNCHRONE avec .then())
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${activeGroupId}`,
        },
        (payload) => {
          console.log('🔔 [TRIGGER REALTIME] Message reçu:', {
            eventType: payload.eventType,
            new: payload.new,
            timestamp: new Date().toISOString()
          });
          
          // ✅ CORRECTION #5 : Vérification payload.new
          if (!payload.new) {
            console.warn('⚠️ [TRIGGER REALTIME] payload.new est undefined');
            return;
          }
          
          const message = payload.new;
          
          console.log('📨 [TRIGGER REALTIME] Contenu message:', {
            id: message.id,
            is_system: message.is_system,
            message: message.message,
            group_id: message.group_id
          });
          
          // Si c'est un trigger d'attribution de bar
          if (message.is_system && message.message === 'AUTO_BAR_ASSIGNMENT_TRIGGER') {
            console.log('🎯 [TRIGGER REALTIME] ✅ Trigger AUTO_BAR_ASSIGNMENT détecté!');
            
            // ✅ CORRECTION #3 : Protection anti-spam
            if (processedTriggers.current.has(message.id)) {
              console.log('⏭️ [TRIGGER REALTIME] Trigger déjà traité, ignore:', message.id);
              return;
            }
            
            // Marquer comme traité IMMÉDIATEMENT
            processedTriggers.current.add(message.id);
            console.log('✅ [TRIGGER REALTIME] Marqué comme traité:', message.id);
            
            // ✅ CORRECTION #2 : Chaîne .then() au lieu de async/await
            console.log('📡 [TRIGGER REALTIME] Récupération coordonnées groupe...');
            
            const invokeBarAssignment = async () => {
              try {
                const { data: groupData, error: fetchError } = await supabase
                  .from('groups')
                  .select('latitude, longitude, bar_place_id')
                  .eq('id', activeGroupId)
                  .single();
                
                if (fetchError) {
                  console.error('❌ [TRIGGER REALTIME] Erreur fetch groupe:', fetchError);
                  processedTriggers.current.delete(message.id);
                  return;
                }
                
                console.log('📍 [TRIGGER REALTIME] Données groupe:', {
                  latitude: groupData?.latitude,
                  longitude: groupData?.longitude,
                  bar_place_id: groupData?.bar_place_id
                });
                
                if (groupData?.bar_place_id) {
                  console.log('⏭️ [TRIGGER REALTIME] Bar déjà assigné, ignore');
                  return;
                }
                
                if (!groupData?.latitude || !groupData?.longitude) {
                  console.error('❌ [TRIGGER REALTIME] Coordonnées manquantes');
                  processedTriggers.current.delete(message.id);
                  return;
                }
                
                console.log('🚀 [TRIGGER REALTIME] Invocation edge function simple-auto-assign-bar...');
                const { data, error } = await supabase.functions.invoke('simple-auto-assign-bar', {
                  body: {
                    group_id: activeGroupId,
                    latitude: groupData.latitude,
                    longitude: groupData.longitude
                  }
                });
                
                if (error) {
                  console.error('❌ [TRIGGER REALTIME] Erreur invocation edge function:', error);
                  processedTriggers.current.delete(message.id);
                } else {
                  console.log('✅ [TRIGGER REALTIME] Edge function appelée avec succès:', data);
                }
              } catch (error) {
                console.error('❌ [TRIGGER REALTIME] Erreur globale:', error);
                processedTriggers.current.delete(message.id);
              }
            };
            
            // Appeler sans bloquer le callback Realtime
            invokeBarAssignment();
          } else {
            console.log('ℹ️ [TRIGGER REALTIME] Message non-trigger:', {
              is_system: message.is_system,
              message: message.message?.substring(0, 50)
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [REALTIME] Désinscription du groupe:', activeGroupId);
      supabase.removeChannel(channel);
    };
  }, [activeGroupId, user?.id]); // ✅ CORRECTION #4 : Dépendances correctes (sans queryClient)

  // Fonction de création de groupe avec rate limiting
  const joinRandomGroup = async (): Promise<boolean> => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) {
      return false;
    }


    const isAuthenticated = await UnifiedGroupService.verifyUserAuthentication();
    if (!isAuthenticated) {
      toast({ 
        title: 'Session expirée', 
        description: 'Veuillez vous reconnecter.', 
        variant: 'destructive' 
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('🎯 DÉBUT - Recherche/Création de groupe avec nouveau système');
      
      // 1. Géolocalisation fraîche
      console.log('📍 Géolocalisation...');
      const location = await getUserLocation(true);
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire pour créer un groupe.', 
          variant: 'destructive' 
        });
        return false;
      }

      // 2. Vérification UNIFIÉE des participations existantes avec nouveau système
      console.log('🔍 Vérification des participations avec nouveau système...');
      const allParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (allParticipations.length > 0) {
        console.log('⚠️ Participation active détectée avec nouveau système');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif.', 
          variant: 'destructive' 
        });
        return false;
      }

      // 3. Recherche de groupe compatible
      console.log('🌍 Recherche de groupe compatible...');
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(location);

      if (!targetGroup) {
        // 4. Création de groupe neuf
        console.log('🆕 Création d\'un groupe neuf...');
        const newGroup = await UnifiedGroupService.createGroup(location, user.id);
        
        if (newGroup) {
          trackGroupCreate(newGroup.id);
          queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '🎉 Nouveau groupe créé', 
            description: `Groupe créé à ${location.locationName}. Vous pouvez maintenant fermer l'app !`, 
          });
          return true;
        }
        return false;
      } else {
        // 5. Rejoindre groupe existant
        console.log('🔗 Rejoindre groupe compatible existant...');
        const success = await UnifiedGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          trackGroupJoin(targetGroup.id);
          queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe à ${location.locationName}. Vous pouvez fermer l'app !`, 
          });
        }
        return success;
      }
    } catch (error) {
      ErrorHandler.logError('JOIN_RANDOM_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de sortie avec nettoyage LOCAL seulement
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) {
      return;
    }


    setLoading(true);
    try {
      console.log('🚪 [UNIFIED] Sortie de groupe...');
      
      // 1. Nettoyage immédiat de l'état local
      setGroupMembers([]);
      queryClient.setQueryData(['unifiedUserGroups', user.id], []);

      // 2. Sortie du groupe
      const success = await UnifiedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        // 3. Invalidation contrôlée du cache
        queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
        
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe avec succès.' 
        });
        
        // 4. Refetch après délai
        setTimeout(() => refetchGroups(), 1000);
      }
    } catch (error) {
      ErrorHandler.logError('LEAVE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
    } finally {
      setLoading(false);
    }
  };

  return {
    userGroups,
    groupMembers,
    loading: loading || groupsLoading,
    userLocation,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups,
    refetchGroups,
    // Debug info
    isHeartbeatActive,
    activeGroupId
  };
};
