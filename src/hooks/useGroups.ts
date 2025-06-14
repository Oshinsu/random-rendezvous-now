
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { GeolocationService, LocationData } from '@/services/geolocation';

// Liste des bars parisiens pour la sélection aléatoire
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

const getRandomBar = (userLat?: number, userLng?: number) => {
  if (userLat && userLng) {
    // Trier les bars par distance si on a la position utilisateur
    const barsWithDistance = PARIS_BARS.map(bar => ({
      ...bar,
      distance: GeolocationService.calculateDistance(userLat, userLng, bar.lat, bar.lng)
    })).sort((a, b) => a.distance - b.distance);
    
    // Prendre un des 5 bars les plus proches au hasard
    const nearestBars = barsWithDistance.slice(0, 5);
    const randomIndex = Math.floor(Math.random() * nearestBars.length);
    return nearestBars[randomIndex];
  }
  
  // Fallback: bar complètement aléatoire
  const randomIndex = Math.floor(Math.random() * PARIS_BARS.length);
  return PARIS_BARS[randomIndex];
};

// Global channel reference to prevent multiple subscriptions
let globalChannel: any = null;
let subscriberCount = 0;

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  // Obtenir la géolocalisation de l'utilisateur au montage
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await GeolocationService.getCurrentLocation();
        setUserLocation(location);
        console.log('📍 Position utilisateur obtenue:', location);
      } catch (error) {
        console.warn('⚠️ Impossible d\'obtenir la position:', error);
        // On continue sans géolocalisation
      }
    };

    getUserLocation();
  }, []);

  const fetchUserGroups = useCallback(async () => {
    if (!user || fetchingRef.current) {
      console.log('🚫 Fetch bloqué - utilisateur:', !!user, 'en cours:', fetchingRef.current);
      return;
    }
    
    // Éviter les appels trop fréquents
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
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

      // Vérifier et corriger le comptage des participants pour chaque groupe
      if (groupsData && groupsData.length > 0) {
        for (const group of groupsData) {
          await syncGroupParticipantCount(group.id);
        }
        
        // Re-fetch les groupes après correction
        const { data: correctedGroups } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false });
        
        setUserGroups((correctedGroups || []) as Group[]);
      } else {
        setUserGroups([]);
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
  }, [user]);

  // Nouvelle fonction pour synchroniser le comptage des participants
  const syncGroupParticipantCount = async (groupId: string) => {
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

      // Mettre à jour le groupe avec le bon comptage
      const { error: updateError } = await supabase
        .from('groups')
        .update({ current_participants: realCount })
        .eq('id', groupId);

      if (updateError) {
        console.error('❌ Erreur de mise à jour:', updateError);
      } else {
        console.log('✅ Comptage synchronisé:', realCount);
      }
    } catch (error) {
      console.error('❌ Erreur de synchronisation:', error);
    }
  };

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

      // Filtrer par distance (rayon de 5km par défaut)
      const compatibleGroups = nearbyGroups.filter(group => {
        if (!group.latitude || !group.longitude) return false;
        
        const distance = GeolocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          group.latitude,
          group.longitude
        );
        
        const searchRadius = group.search_radius || 5000; // 5km par défaut
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

        // Ajouter la géolocalisation si disponible
        if (userLocation) {
          newGroupData.latitude = userLocation.latitude;
          newGroupData.longitude = userLocation.longitude;
          newGroupData.location_name = userLocation.locationName;
          newGroupData.search_radius = 5000; // 5km par défaut
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

      // Mettre à jour le nombre de participants
      const newParticipantCount = targetGroup.current_participants + 1;
      
      if (newParticipantCount >= 5) {
        const randomBar = getRandomBar(
          targetGroup.latitude || userLocation?.latitude,
          targetGroup.longitude || userLocation?.longitude
        );
        const meetingTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        await supabase
          .from('groups')
          .update({
            current_participants: newParticipantCount,
            status: 'confirmed',
            bar_name: randomBar.name,
            bar_address: randomBar.address,
            meeting_time: meetingTime.toISOString()
          })
          .eq('id', targetGroup.id);

        toast({ 
          title: '🎉 Groupe complet !', 
          description: `Votre groupe de 5 est formé ! Rendez-vous au ${randomBar.name} dans 2h.`,
        });
      } else {
        await supabase
          .from('groups')
          .update({ current_participants: newParticipantCount })
          .eq('id', targetGroup.id);

        const locationInfo = userLocation ? ` près de ${userLocation.locationName}` : '';
        toast({ 
          title: '🚀 Vous êtes dans la course !', 
          description: `Groupe rejoint${locationInfo} ! En attente de ${5 - newParticipantCount} autre${5 - newParticipantCount > 1 ? 's' : ''} participant${5 - newParticipantCount > 1 ? 's' : ''}.`,
        });
      }

      // Attendre un peu avant de rafraîchir pour éviter les conflits
      setTimeout(() => {
        fetchUserGroups();
      }, 500);
      
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

  const leaveGroup = async (groupId: string) => {
    if (!user || loading) {
      console.log('🚫 Impossible de quitter - pas d\'utilisateur ou chargement en cours');
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 Quitter le groupe:', groupId, 'utilisateur:', user.id);

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
        // Remettre le groupe en attente s'il y a moins de 5 participants
        console.log('⏳ Remise du groupe en attente');
        await supabase
          .from('groups')
          .update({
            status: 'waiting',
            bar_name: null,
            bar_address: null,
            meeting_time: null
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
      }, 500);
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
    }
  }, [user?.id]); // Utiliser user.id plutôt que user pour éviter les re-renders

  // ➜ Souscription en temps réel aux changements de participations utilisateur
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
            // Rafraîchir les groupes pour tous les utilisateurs connectés
            fetchUserGroups();
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
    loading,
    userLocation,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups
  };
};
