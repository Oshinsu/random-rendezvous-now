import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupMember } from '@/types/groups';
import { GroupMembersService } from '@/services/groupMembers';
import { GroupOperationsService } from '@/services/groupOperations';

// Global channel reference to prevent multiple subscriptions
let globalChannel: any = null;
let subscriberCount = 0;

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  // GÉOLOCALISATION OBLIGATOIRE au montage
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        console.log('📍 Récupération OBLIGATOIRE de la géolocalisation...');
        const location = await GeolocationService.getCurrentLocation();
        setUserLocation(location);
        console.log('✅ Position utilisateur obtenue:', location);
        toast({
          title: '📍 Position détectée',
          description: `Localisation: ${location.locationName}. Recherche dans un rayon de 10km.`,
        });
      } catch (error) {
        console.error('❌ ERREUR CRITIQUE - Géolocalisation obligatoire refusée:', error);
        toast({
          title: '🚫 Géolocalisation requise',
          description: 'Votre position est obligatoire pour rejoindre des groupes dans votre zone (10km). Veuillez autoriser la géolocalisation.',
          variant: 'destructive'
        });
      }
    };

    getUserLocation();
  }, []);

  // Fonction pour récupérer les membres d'un groupe
  const fetchGroupMembers = useCallback(async (groupId: string) => {
    const members = await GroupMembersService.fetchGroupMembers(groupId);
    setGroupMembers(members);
    return members;
  }, []);

  // FONCTION AMÉLIORÉE pour nettoyer complètement l'état après avoir quitté un groupe
  const clearUserGroupsState = useCallback(() => {
    console.log('🧹 Nettoyage complet de l\'état des groupes utilisateur');
    setUserGroups([]);
    setGroupMembers([]);
    setGroups([]);
  }, []);

  const fetchUserGroups = useCallback(async () => {
    if (!user || fetchingRef.current) {
      console.log('🚫 Fetch bloqué - utilisateur:', !!user, 'en cours:', fetchingRef.current);
      return;
    }
    
    // Éviter les appels trop fréquents (RÉDUIT pour plus de réactivité)
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) { // Réduit à 1 seconde
      console.log('🚫 Fetch trop fréquent, ignoré');
      return;
    }
    
    fetchingRef.current = true;
    lastFetchRef.current = now;
    setLoading(true);
    
    try {
      console.log('🔄 [LAST_SEEN] Récupération des groupes pour:', user.id);
      
      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (participationError) {
        console.error('❌ Erreur participations:', participationError);
        throw participationError;
      }

      console.log('✅ Participations trouvées:', participations?.length || 0);

      if (!participations || participations.length === 0) {
        console.log('📭 Aucune participation trouvée - nettoyage de l\'état');
        clearUserGroupsState();
        return;
      }

      const groupIds = participations.map(p => p.group_id);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('❌ Erreur groupes:', groupsError);
        throw groupsError;
      }

      console.log('✅ [LAST_SEEN] Groupes récupérés avant correction:', groupsData?.length || 0);

      // CORRECTION OBLIGATOIRE: Vérifier et corriger CHAQUE groupe
      if (groupsData && groupsData.length > 0) {
        for (const group of groupsData) {
          console.log(`🔍 [LAST_SEEN] Vérification du groupe ${group.id}...`);
          await fetchGroupMembers(group.id);
          // Mettre à jour le last_seen de l'utilisateur pour ce groupe
          await GroupMembersService.updateUserLastSeen(group.id, user.id);
        }
        
        // Re-fetch les groupes après toutes les corrections
        const { data: correctedGroups } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false });
        
        const finalGroups = (correctedGroups || []) as Group[];
        console.log('📊 [LAST_SEEN] Groupes après correction complète:', finalGroups);
        setUserGroups(finalGroups);

        // Charger les membres du premier groupe actif (après correction)
        if (finalGroups.length > 0) {
          await fetchGroupMembers(finalGroups[0].id);
        }
      } else {
        console.log('📭 Aucun groupe valide trouvé après récupération');
        clearUserGroupsState();
      }
    } catch (error) {
      console.error('❌ Erreur fetchUserGroups:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de récupérer vos groupes.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user, fetchGroupMembers, clearUserGroupsState]);

  // Fonction pour rejoindre un groupe aléatoire avec géolocalisation OBLIGATOIRE
  const joinRandomGroup = async () => {
    const success = await GroupOperationsService.joinRandomGroup(
      user,
      userLocation,
      loading,
      setLoading
    );
    
    if (success) {
      // Attendre un peu avant de rafraîchir pour éviter les conflits
      setTimeout(() => {
        fetchUserGroups();
      }, 1000);
    }
    
    return success;
  };

  // FONCTION AMÉLIORÉE pour quitter un groupe avec nettoyage complet
  const leaveGroup = async (groupId: string) => {
    await GroupOperationsService.leaveGroup(
      groupId,
      user,
      loading,
      setLoading,
      clearUserGroupsState
    );
    
    // ÉTAPE 4: Forcer une vérification finale après un délai
    setTimeout(() => {
      console.log('🔄 Vérification finale des groupes utilisateur');
      fetchUserGroups();
    }, 2000);
  };

  // Effect pour charger les groupes au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      console.log('🔄 Utilisateur détecté, chargement des groupes...');
      fetchUserGroups();
    } else {
      console.log('🚫 Pas d\'utilisateur, reset des groupes');
      clearUserGroupsState();
    }
  }, [user?.id, fetchUserGroups, clearUserGroupsState]);

  // ➜ Souscription en temps réel aux changements de participations utilisateur ET de groupes (AMÉLIORÉE)
  useEffect(() => {
    if (!user) return;

    // Incrémenter le compteur d'abonnés
    subscriberCount++;
    console.log('📡 Nouveaux abonnés:', subscriberCount);

    // Créer ou réutiliser le canal global
    if (!globalChannel) {
      console.log('🛰️ Création du canal realtime global');
      globalChannel = supabase
        .channel('global-group-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_participants',
          },
          (payload) => {
            console.log('🛰️ [LAST_SEEN] Changement détecté sur group_participants:', payload);
            
            // Débounce plus court pour plus de réactivité
            const debounceKey = 'realtime-participants-update';
            clearTimeout((window as any)[debounceKey]);
            (window as any)[debounceKey] = setTimeout(() => {
              fetchUserGroups();
            }, 800); // Réduit à 800ms
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'groups',
          },
          (payload) => {
            console.log('🛰️ [LAST_SEEN] Changement détecté sur groups:', payload);
            
            // Débounce encore plus court pour les mises à jour de groupes (assignation de bar)
            const debounceKey = 'realtime-groups-update';
            clearTimeout((window as any)[debounceKey]);
            (window as any)[debounceKey] = setTimeout(() => {
              fetchUserGroups();
            }, 500); // Très réactif pour les mises à jour de bar
          }
        )
        .subscribe();
    }

    return () => {
      // Décrémenter le compteur d'abonnés
      subscriberCount--;
      console.log('📡 Abonnés restants:', subscriberCount);

      // Nettoyer le canal seulement quand il n'y a plus d'abonnés
      if (subscriberCount <= 0 && globalChannel) {
        console.log('🛰️ Fermeture du canal realtime global');
        supabase.removeChannel(globalChannel);
        globalChannel = null;
      }
    };
  }, [user?.id, fetchUserGroups]);

  // Effect pour mettre à jour périodiquement le last_seen de l'utilisateur
  useEffect(() => {
    if (!user || userGroups.length === 0) return;

    const updateLastSeenPeriodically = () => {
      userGroups.forEach(group => {
        GroupMembersService.updateUserLastSeen(group.id, user.id);
      });
    };

    // Mettre à jour le last_seen toutes les 2 minutes
    const interval = setInterval(updateLastSeenPeriodically, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, userGroups]);

  return {
    groups,
    userGroups,
    groupMembers,
    loading,
    userLocation,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups,
    fetchGroupMembers
  };
};

export type { GroupMember } from '@/types/groups';
