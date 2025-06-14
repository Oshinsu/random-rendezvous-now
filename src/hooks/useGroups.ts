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
}

// Global channel reference to prevent multiple subscriptions
let globalChannel: any = null;
let subscriberCount = 0;

// Cache pour éviter les messages système répétitifs
const sentSystemMessages = new Set<string>();

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

  // Fonction pour envoyer un message système au chat du groupe (avec protection anti-spam)
  const sendGroupSystemMessage = async (groupId: string, message: string) => {
    try {
      // Créer une clé unique pour ce message et groupe
      const messageKey = `${groupId}:${message}`;
      
      // Vérifier si ce message a déjà été envoyé récemment
      if (sentSystemMessages.has(messageKey)) {
        console.log('🚫 Message système déjà envoyé récemment, ignoré:', message);
        return;
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
        // Ajouter au cache et supprimer après 30 secondes
        sentSystemMessages.add(messageKey);
        setTimeout(() => {
          sentSystemMessages.delete(messageKey);
        }, 30000);
      }
    } catch (error) {
      console.error('❌ Erreur sendGroupSystemMessage:', error);
    }
  };

  const fetchGroupMembers = useCallback(async (groupId: string) => {
    try {
      console.log('👥 Récupération des membres du groupe:', groupId);
      
      // Récupérer les participants avec leurs profils en utilisant la clé étrangère
      const { data: participantsData, error: participantsError } = await supabase
        .from('group_participants')
        .select(`
          id,
          user_id,
          joined_at,
          status
        `)
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (participantsError) {
        console.error('❌ Erreur récupération participants:', participantsError);
        throw participantsError;
      }

      console.log('✅ Participants récupérés:', participantsData?.length || 0);

      if (!participantsData) {
        setGroupMembers([]);
        return [];
      }

      // Transformer les données pour correspondre à l'interface GroupMember avec noms masqués
      const members: GroupMember[] = participantsData.map((participant: any, index: number) => {
        // Utiliser des noms masqués "Rander 1", "Rander 2", etc.
        const maskedName = `Rander ${index + 1}`;

        return {
          id: participant.id,
          name: maskedName,
          isConnected: true, // Tous connectés pour le test
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending'
        };
      });

      console.log('👥 Membres transformés avec noms masqués (tous connectés):', members);
      setGroupMembers(members);
      return members;
    } catch (error) {
      console.error('❌ Erreur fetchGroupMembers:', error);
      setGroupMembers([]);
      return [];
    }
  }, []);

  const fetchUserGroups = useCallback(async () => {
    if (!user || fetchingRef.current) {
      console.log('🚫 Fetch bloqué - utilisateur:', !!user, 'en cours:', fetchingRef.current);
      return;
    }
    
    // Éviter les appels trop fréquents
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) { // Augmenté à 2 secondes
      console.log('🚫 Fetch trop fréquent, ignoré');
      return;
    }
    
    fetchingRef.current = true;
    lastFetchRef.current = now;
    setLoading(true);
    
    try {
      console.log('🔄 Récupération des groupes pour:', user.id);
      
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
        setUserGroups([]);
        setGroupMembers([]);
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

      console.log('✅ Groupes récupérés:', groupsData?.length || 0);

      // Vérifier et corriger le comptage des participants pour chaque groupe (sans spam)
      if (groupsData && groupsData.length > 0) {
        for (const group of groupsData) {
          // Éviter la synchronisation si déjà en cours pour ce groupe
          if (!syncingGroupsRef.current.has(group.id)) {
            await syncGroupParticipantCount(group.id);
          }
        }
        
        // Re-fetch les groupes après correction
        const { data: correctedGroups } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false });
        
        const finalGroups = (correctedGroups || []) as Group[];
        console.log('📊 Groupes après synchronisation:', finalGroups);
        setUserGroups(finalGroups);

        // Charger les membres du premier groupe actif
        if (finalGroups.length > 0) {
          await fetchGroupMembers(finalGroups[0].id);
        }
      } else {
        setUserGroups([]);
        setGroupMembers([]);
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
  }, [user, fetchGroupMembers]);

  // Fonction améliorée pour synchroniser le comptage des participants (SANS BOUCLE)
  const syncGroupParticipantCount = async (groupId: string) => {
    // Éviter les synchronisations parallèles pour le même groupe
    if (syncingGroupsRef.current.has(groupId)) {
      console.log('🚫 Synchronisation déjà en cours pour le groupe:', groupId);
      return;
    }

    syncingGroupsRef.current.add(groupId);

    try {
      console.log('🔄 Synchronisation du comptage pour le groupe:', groupId);
      
      // Compter les vrais participants
      const { data: realParticipants, error: countError } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (countError) {
        console.error('❌ Erreur de comptage:', countError);
        return;
      }

      const realCount = realParticipants?.length || 0;
      console.log('📊 Nombre réel de participants:', realCount);

      // Vérifier l'état actuel du groupe
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('status, bar_name, bar_address, meeting_time, bar_latitude, bar_longitude, latitude, longitude, current_participants')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
        return;
      }

      console.log('📋 État actuel du groupe:', currentGroup);

      // CORRECTION: Éviter les mises à jour inutiles
      if (currentGroup.current_participants === realCount && 
          (realCount < 5 || (realCount >= 5 && currentGroup.status === 'confirmed'))) {
        console.log('✅ Groupe déjà synchronisé, pas de mise à jour nécessaire');
        return;
      }

      // Si on a 5 participants, passer en confirmed ET rechercher un bar si nécessaire
      if (realCount >= 5) {
        console.log('🎯 Groupe complet détecté, passage en confirmed...');
        
        let updateData: any = {
          current_participants: realCount,
          status: 'confirmed'
        };

        // Si pas de bar assigné ET pas encore de message système envoyé, en rechercher un
        if (!currentGroup.bar_name) {
          console.log('🍺 Recherche de bar nécessaire...');
          
          try {
            // Utiliser obligatoirement la position utilisateur actuelle ou échouer
            let searchLatitude: number | null = null;
            let searchLongitude: number | null = null;
            
            // 1. Priorité à la position utilisateur actuelle
            if (userLocation) {
              searchLatitude = userLocation.latitude;
              searchLongitude = userLocation.longitude;
              console.log('📍 Utilisation position utilisateur actuelle:', { searchLatitude, searchLongitude, location: userLocation.locationName });
            }
            // 2. Sinon, position du groupe si elle existe
            else if (currentGroup.latitude && currentGroup.longitude) {
              searchLatitude = currentGroup.latitude;
              searchLongitude = currentGroup.longitude;
              console.log('📍 Utilisation position du groupe:', { searchLatitude, searchLongitude });
            }
            
            // Si aucune position valide disponible, passer quand même en confirmed sans bar
            if (!searchLatitude || !searchLongitude) {
              console.error('❌ ERREUR: Aucune position géographique fiable disponible pour la recherche de bar');
              
              await supabase
                .from('groups')
                .update({ 
                  current_participants: realCount,
                  status: 'confirmed'
                })
                .eq('id', groupId);
              
              return;
            }
            
            console.log('🔍 DÉBUT recherche bar via API avec position validée:', { searchLatitude, searchLongitude });
            
            // Appel à l'API pour trouver un bar avec un rayon adapté à la région
            const searchRadius = userLocation?.locationName?.toLowerCase().includes('martinique') ? 15000 : 8000;
            console.log('📏 Rayon de recherche adapté:', searchRadius, 'mètres');
            
            const selectedBar = await GooglePlacesService.findNearbyBars(
              searchLatitude,
              searchLongitude,
              searchRadius
            );
            
            console.log('🔍 RÉSULTAT recherche bar:', selectedBar);
            
            if (selectedBar && selectedBar.name) {
              // Vérifier que ce n'est pas un hôtel
              const barName = selectedBar.name.toLowerCase();
              const isHotel = ['hotel', 'hôtel', 'motel', 'resort', 'auberge'].some(hotelWord => 
                barName.includes(hotelWord)
              );
              
              if (isHotel) {
                console.error('❌ ERREUR: L\'API a retourné un hôtel au lieu d\'un bar:', selectedBar.name);
                throw new Error('Résultat invalide: hôtel détecté');
              }
              
              // Bar valide trouvé via API
              const meetingTime = new Date(Date.now() + 1 * 60 * 60 * 1000);
              
              updateData = {
                ...updateData,
                bar_name: selectedBar.name,
                bar_address: selectedBar.formatted_address,
                meeting_time: meetingTime.toISOString(),
                bar_latitude: selectedBar.geometry.location.lat,
                bar_longitude: selectedBar.geometry.location.lng,
                bar_place_id: selectedBar.place_id
              };
              
              console.log('🍺 Bar validé et assigné via API:', {
                name: selectedBar.name,
                address: selectedBar.formatted_address,
                meetingTime: meetingTime.toLocaleString('fr-FR'),
                coordinates: `${selectedBar.geometry.location.lat}, ${selectedBar.geometry.location.lng}`
              });
            } else {
              throw new Error('Aucun bar trouvé via API');
            }
          } catch (barError) {
            console.error('❌ Erreur recherche de bar via API:', barError);
            // Passer quand même le groupe en confirmed pour que la carte s'affiche, sans message
          }
        }

        // Mettre à jour le groupe
        console.log('💾 Mise à jour du groupe avec:', updateData);
        const { error: updateError } = await supabase
          .from('groups')
          .update(updateData)
          .eq('id', groupId);

        if (updateError) {
          console.error('❌ Erreur de mise à jour du groupe:', updateError);
        } else {
          console.log('✅ Groupe mis à jour avec succès');
          
          // Envoyer seulement UN message système quand un bar est trouvé ET seulement si pas déjà envoyé
          if (updateData.bar_name) {
            await sendGroupSystemMessage(
              groupId, 
              `🎉 Votre groupe est maintenant complet ! Rendez-vous au ${updateData.bar_name} dans environ 1 heure.`
            );
          }
        }
      } else {
        // Juste mettre à jour le comptage sans message système
        const { error: updateError } = await supabase
          .from('groups')
          .update({ current_participants: realCount })
          .eq('id', groupId);

        if (updateError) {
          console.error('❌ Erreur de mise à jour du comptage:', updateError);
        } else {
          console.log('✅ Comptage synchronisé:', realCount);
        }
      }
    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error);
    } finally {
      // Libérer le verrou de synchronisation
      syncingGroupsRef.current.delete(groupId);
    }
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

  // ... keep existing code (findCompatibleGroup function)

  const findCompatibleGroup = async (userLocation: LocationData) => {
    try {
      console.log('🔍 Recherche de groupes compatibles près de:', userLocation.locationName);
      
      // Rechercher des groupes en attente dans un rayon géographique
      const { data: nearbyGroups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 5)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('❌ Erreur recherche groupes:', error);
        throw error;
      }

      if (!nearbyGroups || nearbyGroups.length === 0) {
        console.log('📍 Aucun groupe géolocalisé trouvé');
        return null;
      }

      // Filtrer par distance (rayon de 10km par défaut)
      const compatibleGroups = nearbyGroups.filter(group => {
        if (!group.latitude || !group.longitude) return false;
        
        const distance = GeolocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          group.latitude,
          group.longitude
        );
        
        const searchRadius = group.search_radius || 10000; // 10km par défaut
        console.log(`📏 Distance au groupe ${group.id}: ${GeolocationService.formatDistance(distance)} (rayon: ${GeolocationService.formatDistance(searchRadius)})`);
        return distance <= searchRadius;
      });

      if (compatibleGroups.length === 0) {
        console.log('📍 Aucun groupe dans le rayon de recherche');
        return null;
      }

      // Trier par distance et prendre le plus proche
      compatibleGroups.sort((a, b) => {
        const distanceA = GeolocationService.calculateDistance(
          userLocation.latitude, userLocation.longitude,
          a.latitude!, a.longitude!
        );
        const distanceB = GeolocationService.calculateDistance(
          userLocation.latitude, userLocation.longitude,
          b.latitude!, b.longitude!
        );
        return distanceA - distanceB;
      });

      const selectedGroup = compatibleGroups[0];
      const distance = GeolocationService.calculateDistance(
        userLocation.latitude, userLocation.longitude,
        selectedGroup.latitude!, selectedGroup.longitude!
      );

      console.log('✅ Groupe compatible trouvé à', GeolocationService.formatDistance(distance));
      return selectedGroup as Group;
      
    } catch (error) {
      console.error('❌ Erreur recherche groupe compatible:', error);
      return null;
    }
  };

  // Fonction pour rejoindre un groupe aléatoire
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

    console.log('🎲 Démarrage joinRandomGroup pour:', user.id);
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

      // Ajouter l'utilisateur au groupe
      const participantData: any = {
        group_id: targetGroup.id,
        user_id: user.id,
        status: 'confirmed'
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

      console.log('✅ Utilisateur ajouté au groupe avec succès');

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

  // Fonction pour quitter un groupe
  const leaveGroup = async (groupId: string) => {
    if (!user || loading) {
      console.log('🚫 Impossible de quitter - pas d\'utilisateur ou chargement en cours');
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 Quitter le groupe:', groupId, 'utilisateur:', user.id);

      // Obtenir le nombre de participants avant de quitter
      const participantsBeforeLeaving = await getCurrentParticipantCount(groupId);

      // Supprimer la participation avec vérification explicite de l'utilisateur
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

      console.log('✅ Participation supprimée');

      // Synchroniser le comptage après suppression
      await syncGroupParticipantCount(groupId);

      // Vérifier s'il reste des participants
      const { data: remainingParticipants, error: checkError } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (!checkError && remainingParticipants && remainingParticipants.length === 0) {
        // Supprimer le groupe s'il est vide
        console.log('🗑️ Suppression du groupe vide');
        await supabase
          .from('groups')
          .delete()
          .eq('id', groupId);
      } else if (!checkError && remainingParticipants && remainingParticipants.length < 5) {
        // Remettre le groupe en attente ET supprimer les infos du bar s'il y a moins de 5 participants
        console.log('⏳ Remise du groupe en attente et suppression des infos bar');
        await supabase
          .from('groups')
          .update({
            status: 'waiting',
            bar_name: null,
            bar_address: null,
            meeting_time: null,
            bar_latitude: null,
            bar_longitude: null,
            bar_place_id: null
          })
          .eq('id', groupId);
      }

      toast({ 
        title: '✅ Groupe quitté', 
        description: 'Vous avez quitté le groupe avec succès.' 
      });
      
      // Attendre un peu avant de rafraîchir
      setTimeout(() => {
        fetchUserGroups();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur pour quitter le groupe:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de quitter le groupe. Veuillez réessayer.', 
        variant: 'destructive' 
      });
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
      setUserGroups([]);
      setGroupMembers([]);
    }
  }, [user?.id]); // Utiliser user.id plutôt que user pour éviter les re-renders

  // ➜ Souscription en temps réel aux changements de participations utilisateur (OPTIMISÉE)
  useEffect(() => {
    if (!user) return;

    // Incrémenter le compteur d'abonnés
    subscriberCount++;
    console.log('📡 Nouveaux abonnés:', subscriberCount);

    // Créer ou réutiliser le canal global
    if (!globalChannel) {
      console.log('🛰️ Création du canal realtime global');
      globalChannel = supabase
        .channel('global-group-participants-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_participants',
          },
          (payload) => {
            console.log('🛰️ [Realtime] Changement détecté sur group_participants:', payload);
            
            // Débounce pour éviter les appels trop fréquents
            const debounceKey = 'realtime-update';
            clearTimeout((window as any)[debounceKey]);
            (window as any)[debounceKey] = setTimeout(() => {
              fetchUserGroups();
            }, 1500); // Attendre 1.5 secondes avant de rafraîchir
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
