import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GooglePlacesService } from '@/services/googlePlaces';

// Liste des bars parisiens pour la sélection aléatoire (fallback seulement)
const PARIS_BARS = [
  { name: "Le Procope", address: "13 Rue de l'Ancienne Comédie, 75006 Paris", lat: 48.8534, lng: 2.3371 },
  { name: "Harry's Bar", address: "5 Rue Daunou, 75002 Paris", lat: 48.8699, lng: 2.3314 },
  { name: "Le Mary Celeste", address: "1 Rue Commines, 75003 Paris", lat: 48.8596, lng: 2.3639 },
  { name: "Candelaria", address: "52 Rue de Saintonge, 75003 Paris", lat: 48.8625, lng: 2.3639 },
  { name: "Little Red Door", address: "60 Rue Charlot, 75003 Paris", lat: 48.8630, lng: 2.3652 },
  { name: "Le Syndicat", address: "51 Rue du Faubourg Saint-Antoine, 75011 Paris", lat: 48.8532, lng: 2.3724 },
  { name: "Hemingway Bar", address: "15 Place Vendôme, 75001 Paris", lat: 48.8670, lng: 2.3292 },
  { name: "Le Bar du Plaza", address: "25 Avenue Montaigne, 75008 Paris", lat: 48.8665, lng: 2.3065 },
  { name: "Moonshiner", address: "5 Rue Sedaine, 75011 Paris", lat: 48.8553, lng: 2.3714 },
  { name: "Glass", address: "7 Rue Frochot, 75009 Paris", lat: 48.8823, lng: 2.3367 }
];

export interface GroupMember {
  id: string;
  name: string;
  isConnected: boolean;
  joinedAt: string;
  status: 'confirmed' | 'pending';
  lastSeen?: string; // Ajout du champ last_seen
}

// Global channel reference to prevent multiple subscriptions
let globalChannel: any = null;
let subscriberCount = 0;

// Cache pour éviter les messages système répétitifs - AMÉLIORÉ
const sentSystemMessages = new Set<string>();
const lastBarAssignmentTime = new Map<string, number>();

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const syncingGroupsRef = useRef(new Set<string>()); // Track des groupes en cours de synchronisation

  // Fonction pour mettre à jour le last_seen de l'utilisateur actuel
  const updateUserLastSeen = useCallback(async (groupId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('❌ Erreur mise à jour last_seen:', error);
      } else {
        console.log('✅ Last_seen mis à jour pour le groupe:', groupId);
      }
    } catch (error) {
      console.error('❌ Erreur updateUserLastSeen:', error);
    }
  }, [user]);

  // Fonction pour déterminer si un utilisateur est "connecté" basé sur last_seen
  const isUserConnected = (lastSeen: string): boolean => {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    // Considérer un utilisateur comme connecté s'il a été vu dans les 10 dernières minutes
    return diffMinutes <= 10;
  };

  // Obtenir la géolocalisation de l'utilisateur au montage
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await GeolocationService.getCurrentLocation();
        setUserLocation(location);
        console.log('📍 Position utilisateur obtenue:', location);
      } catch (error) {
        console.warn('⚠️ Impossible d\'obtenir la position:', error);
        toast({
          title: '⚠️ Géolocalisation non disponible',
          description: 'La recherche de bars sera moins précise sans votre position.',
          variant: 'destructive'
        });
      }
    };

    getUserLocation();
  }, []);

  // Fonction pour envoyer un message système au chat du groupe (AMÉLIORÉE contre le spam)
  const sendGroupSystemMessage = async (groupId: string, message: string) => {
    try {
      // Créer une clé unique pour ce message et groupe
      const messageKey = `${groupId}:${message}`;
      
      // Vérifier si ce message a déjà été envoyé récemment (plus strict)
      if (sentSystemMessages.has(messageKey)) {
        console.log('🚫 Message système déjà envoyé récemment, ignoré:', message);
        return;
      }

      // Vérifier spécifiquement pour les messages de bar assigné
      if (message.includes('Rendez-vous au')) {
        const lastTime = lastBarAssignmentTime.get(groupId) || 0;
        const now = Date.now();
        if (now - lastTime < 60000) { // 1 minute minimum entre les messages d'assignation
          console.log('🚫 Message d\'assignation de bar trop récent, ignoré');
          return;
        }
        lastBarAssignmentTime.set(groupId, now);
      }

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID factice pour les messages système
          message: message,
          is_system: true
        });

      if (error) {
        console.error('❌ Erreur envoi message système groupe:', error);
      } else {
        console.log('✅ Message système envoyé au groupe:', message);
        // Ajouter au cache et supprimer après 2 minutes (plus long)
        sentSystemMessages.add(messageKey);
        setTimeout(() => {
          sentSystemMessages.delete(messageKey);
        }, 120000);
      }
    } catch (error) {
      console.error('❌ Erreur sendGroupSystemMessage:', error);
    }
  };

  // Fonction pour récupérer les membres d'un groupe AVEC NOUVEAU SYSTÈME last_seen
  const fetchGroupMembers = useCallback(async (groupId: string) => {
    try {
      console.log('👥 [LAST_SEEN] Récupération des membres avec statut de connexion:', groupId);
      
      // ÉTAPE 1: Récupérer TOUS les participants confirmés avec last_seen
      const { data: participantsData, error: participantsError } = await supabase
        .from('group_participants')
        .select(`
          id,
          user_id,
          joined_at,
          status,
          last_seen
        `)
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (participantsError) {
        console.error('❌ Erreur récupération participants:', participantsError);
        throw participantsError;
      }

      const realParticipantCount = participantsData?.length || 0;
      console.log('🔍 [LAST_SEEN] Nombre RÉEL de participants confirmés:', realParticipantCount);

      // ÉTAPE 2: Vérifier le comptage dans la table groups
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, status')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
      } else {
        console.log('📊 [LAST_SEEN] Comptage actuel en BDD:', currentGroup.current_participants, 'vs réel:', realParticipantCount);
        
        // ÉTAPE 3: FORCER la correction si les comptages ne correspondent pas
        if (currentGroup.current_participants !== realParticipantCount) {
          console.log('🚨 [LAST_SEEN] INCOHÉRENCE DÉTECTÉE ! Correction forcée...');
          
          // Déterminer le nouveau statut
          let newStatus = currentGroup.status;
          let updateData: any = {
            current_participants: realParticipantCount
          };

          // Si moins de 5 participants, remettre en waiting et supprimer le bar
          if (realParticipantCount < 5 && currentGroup.status === 'confirmed') {
            newStatus = 'waiting';
            updateData = {
              ...updateData,
              status: 'waiting',
              bar_name: null,
              bar_address: null,
              meeting_time: null,
              bar_latitude: null,
              bar_longitude: null,
              bar_place_id: null
            };
            console.log('⏳ [LAST_SEEN] Remise en waiting et suppression du bar');
          }

          // Appliquer la correction
          const { error: correctionError } = await supabase
            .from('groups')
            .update(updateData)
            .eq('id', groupId);

          if (correctionError) {
            console.error('❌ [LAST_SEEN] Erreur lors de la correction:', correctionError);
          } else {
            console.log('✅ [LAST_SEEN] Comptage corrigé avec succès:', realParticipantCount);
          }
        }
      }

      if (!participantsData) {
        setGroupMembers([]);
        return [];
      }

      // ÉTAPE 4: Transformer les données avec noms masqués ET statut de connexion
      const members: GroupMember[] = participantsData.map((participant: any, index: number) => {
        const maskedName = `Rander ${index + 1}`;
        const lastSeenValue = participant.last_seen || participant.joined_at;
        const isConnected = isUserConnected(lastSeenValue);

        return {
          id: participant.id,
          name: maskedName,
          isConnected: isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: lastSeenValue
        };
      });

      console.log('✅ [LAST_SEEN] Membres finaux avec statut de connexion:', members.map(m => ({ name: m.name, connected: m.isConnected })));
      setGroupMembers(members);
      return members;
    } catch (error) {
      console.error('❌ Erreur fetchGroupMembers:', error);
      setGroupMembers([]);
      return [];
    }
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
          await updateUserLastSeen(group.id);
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
  }, [user, fetchGroupMembers, clearUserGroupsState, updateUserLastSeen]);

  // Fonction améliorée pour synchroniser le comptage des participants (SIMPLIFIÉE)
  const syncGroupParticipantCount = async (groupId: string) => {
    // Cette fonction est maintenant intégrée dans fetchGroupMembers
    // pour éviter les doublons et assurer une correction systématique
    console.log('🔄 [SYNC] Synchronisation déléguée à fetchGroupMembers pour:', groupId);
  };

  // Fonction helper pour obtenir le nombre actuel de participants
  const getCurrentParticipantCount = async (groupId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');
      
      if (error) {
        console.error('❌ Erreur comptage participants:', error);
        return 0;
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error('❌ Erreur getCurrentParticipantCount:', error);
      return 0;
    }
  };

  // Fonction pour trouver un groupe compatible géographiquement
  const findCompatibleGroup = async (userLocation: LocationData): Promise<Group | null> => {
    try {
      console.log('🌍 Recherche de groupe compatible géographiquement...');
      
      const { data: waitingGroups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 5)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur recherche groupes géolocalisés:', error);
        return null;
      }

      if (!waitingGroups || waitingGroups.length === 0) {
        console.log('📍 Aucun groupe géolocalisé trouvé');
        return null;
      }

      // Chercher un groupe dans un rayon raisonnable (par exemple 20km)
      const maxDistance = 20000; // 20km en mètres
      
      for (const group of waitingGroups) {
        if (group.latitude && group.longitude) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            group.latitude,
            group.longitude
          );
          
          if (distance <= maxDistance) {
            console.log(`✅ Groupe compatible trouvé à ${Math.round(distance / 1000)}km:`, group.id);
            return group as Group;
          }
        }
      }

      console.log('📍 Aucun groupe dans la zone géographique trouvé');
      return null;
    } catch (error) {
      console.error('❌ Erreur findCompatibleGroup:', error);
      return null;
    }
  };

  // Fonction helper pour calculer la distance entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Fonction pour rejoindre un groupe aléatoire - MISE À JOUR avec last_seen
  const joinRandomGroup = async () => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) {
      console.log('⏳ Opération déjà en cours...');
      return false;
    }

    console.log('🎲 [LAST_SEEN] Démarrage joinRandomGroup pour:', user.id);
    setLoading(true);
    
    try {
      // Vérifier les participations existantes
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(status)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (checkError) {
        console.error('❌ Erreur de vérification:', checkError);
        throw checkError;
      }

      if (existingParticipation && existingParticipation.length > 0) {
        console.log('⚠️ Utilisateur déjà dans un groupe actif');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif !', 
          variant: 'destructive' 
        });
        return false;
      }

      let targetGroup: Group | null = null;

      // 1. Essayer de trouver un groupe compatible géographiquement
      if (userLocation) {
        targetGroup = await findCompatibleGroup(userLocation);
      }

      // 2. Si pas de groupe géolocalisé compatible, chercher un groupe classique
      if (!targetGroup) {
        const { data: waitingGroups, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('status', 'waiting')
          .lt('current_participants', 5)
          .order('created_at', { ascending: true })
          .limit(1);

        if (groupError) {
          console.error('❌ Erreur de recherche de groupes:', groupError);
          throw groupError;
        }

        if (waitingGroups && waitingGroups.length > 0) {
          targetGroup = waitingGroups[0] as Group;
          console.log('🔗 Rejoindre le groupe existant:', targetGroup.id);
        }
      }

      // 3. Si toujours aucun groupe, créer un nouveau groupe
      if (!targetGroup) {
        console.log('🆕 Création d\'un nouveau groupe...');
        const newGroupData: any = {
          status: 'waiting',
          max_participants: 5,
          current_participants: 0
        };

        // Ajouter la géolocalisation si disponible avec rayon de 10km par défaut
        if (userLocation) {
          newGroupData.latitude = userLocation.latitude;
          newGroupData.longitude = userLocation.longitude;
          newGroupData.location_name = userLocation.locationName;
          newGroupData.search_radius = 10000; // 10km par défaut
          console.log('📍 Nouveau groupe avec géolocalisation:', {
            location: userLocation.locationName,
            coordinates: `${userLocation.latitude}, ${userLocation.longitude}`,
            radius: '10km'
          });
        }

        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert(newGroupData)
          .select()
          .single();

        if (createError) {
          console.error('❌ Erreur de création de groupe:', createError);
          throw createError;
        }

        targetGroup = newGroup as Group;
        console.log('✅ Nouveau groupe créé:', targetGroup.id);
      }

      // Ajouter l'utilisateur au groupe avec last_seen initialisé
      const participantData: any = {
        group_id: targetGroup.id,
        user_id: user.id,
        status: 'confirmed',
        last_seen: new Date().toISOString() // Initialiser last_seen
      };

      // Ajouter la géolocalisation du participant si disponible
      if (userLocation) {
        participantData.latitude = userLocation.latitude;
        participantData.longitude = userLocation.longitude;
        participantData.location_name = userLocation.locationName;
      }

      const { error: joinError } = await supabase
        .from('group_participants')
        .insert(participantData);

      if (joinError) {
        console.error('❌ Erreur d\'ajout au groupe:', joinError);
        throw joinError;
      }

      console.log('✅ [LAST_SEEN] Utilisateur ajouté au groupe avec last_seen initialisé');

      // Attendre un peu avant de rafraîchir pour éviter les conflits
      setTimeout(() => {
        fetchUserGroups();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur dans joinRandomGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de rejoindre un groupe. Veuillez réessayer.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // FONCTION AMÉLIORÉE pour quitter un groupe avec nettoyage complet
  const leaveGroup = async (groupId: string) => {
    if (!user || loading) {
      console.log('🚫 Impossible de quitter - pas d\'utilisateur ou chargement en cours');
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 [LAST_SEEN] Quitter le groupe:', groupId, 'utilisateur:', user.id);

      // ÉTAPE 1: Nettoyer immédiatement l'état local pour un feedback visuel instantané
      console.log('🧹 Nettoyage immédiat de l\'état local');
      clearUserGroupsState();

      // ÉTAPE 2: Supprimer la participation avec vérification explicite de l'utilisateur
      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (deleteError) {
        console.error('❌ Erreur pour supprimer la participation:', deleteError);
        throw deleteError;
      }

      console.log('✅ [LAST_SEEN] Participation supprimée avec succès');

      // ÉTAPE 3: FORCER la correction du comptage immédiatement
      const realCount = await getCurrentParticipantCount(groupId);
      console.log('📊 [LAST_SEEN] Participants restants après départ:', realCount);

      if (realCount === 0) {
        // Supprimer le groupe s'il est vide
        console.log('🗑️ [LAST_SEEN] Suppression du groupe vide');
        await supabase
          .from('groups')
          .delete()
          .eq('id', groupId);
      } else {
        // Mettre à jour le comptage et remettre en waiting si nécessaire
        let updateData: any = {
          current_participants: realCount
        };

        if (realCount < 5) {
          updateData = {
            ...updateData,
            status: 'waiting',
            bar_name: null,
            bar_address: null,
            meeting_time: null,
            bar_latitude: null,
            bar_longitude: null,
            bar_place_id: null
          };
          console.log('⏳ [LAST_SEEN] Remise en waiting et suppression du bar');
        }

        await supabase
          .from('groups')
          .update(updateData)
          .eq('id', groupId);
      }

      toast({ 
        title: '✅ Groupe quitté', 
        description: 'Vous avez quitté le groupe avec succès.' 
      });
      
      // ÉTAPE 4: Forcer une vérification finale après un délai
      setTimeout(() => {
        console.log('🔄 Vérification finale des groupes utilisateur');
        fetchUserGroups();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erreur pour quitter le groupe:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de quitter le groupe. Veuillez réessayer.', 
        variant: 'destructive' 
      });
      // En cas d'erreur, re-fetch pour s'assurer de l'état correct
      setTimeout(() => {
        fetchUserGroups();
      }, 1000);
    } finally {
      setLoading(false);
    }
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
        updateUserLastSeen(group.id);
      });
    };

    // Mettre à jour le last_seen toutes les 2 minutes
    const interval = setInterval(updateLastSeenPeriodically, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, userGroups, updateUserLastSeen]);

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
