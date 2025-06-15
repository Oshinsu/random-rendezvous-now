import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupOperationsService } from '@/services/groupOperations';
import { GroupMembersService } from '@/services/groupMembers';
import { showUniqueToast, clearActiveToasts } from '@/utils/toastUtils';
import type { Group } from '@/types/groups';

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  
  // Refs pour éviter les appels multiples
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData> | null>(null);

  // Fonction pour obtenir la géolocalisation (avec cache et debouncing)
  const getUserLocation = async (): Promise<LocationData | null> => {
    // Si on est déjà en train de récupérer la position, retourner la promesse existante
    if (isGettingLocation.current && locationPromise.current) {
      console.log('🔄 Géolocalisation déjà en cours, utilisation du cache...');
      return locationPromise.current;
    }

    // Si on a déjà la position en cache, la retourner
    if (userLocation) {
      console.log('📍 Position déjà en cache:', userLocation);
      return userLocation;
    }

    console.log('📍 Récupération OBLIGATOIRE de la géolocalisation...');
    isGettingLocation.current = true;

    // Créer une nouvelle promesse et la stocker
    locationPromise.current = GeolocationService.getCurrentLocation()
      .then((location) => {
        console.log('✅ Position utilisateur obtenue:', location);
        setUserLocation(location);
        
        // Afficher une seule notification de succès
        showUniqueToast(
          `Localisation: ${location.locationName}. Recherche dans un rayon de 10km.`,
          "📍 Position détectée"
        );
        
        return location;
      })
      .catch((error) => {
        console.warn('⚠️ Erreur de géolocalisation:', error.message);
        showUniqueToast(
          'Matching universel activé - vous pouvez rejoindre des groupes partout.',
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

  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté');
      return [];
    }

    console.log('🔄 [LAST_SEEN] Récupération des groupes pour:', user.id);

    try {
      const participations = await GroupMembersService.getUserParticipations(user.id);
      console.log('✅ Participations trouvées:', participations.length);

      if (participations.length === 0) {
        return [];
      }

      const groupsWithDetails = await Promise.all(
        participations.map(async (participation) => {
          const group = participation.groups;
          if (!group) return null;

          console.log(`🔍 [LAST_SEEN] Vérification du groupe ${group.id}...`);
          
          // Récupérer les membres avec leur statut de connexion
          console.log(`👥 [LAST_SEEN] Récupération des membres avec statut de connexion: ${group.id}`);
          const members = await GroupMembersService.getGroupMembersWithConnectionStatus(group.id);
          
          // Compter le nombre réel de participants confirmés
          const realParticipantCount = members.filter(member => member.connected).length;
          console.log(`🔍 [LAST_SEEN] Nombre RÉEL de participants confirmés: ${realParticipantCount}`);
          
          // Vérifier et corriger si nécessaire
          console.log(`📊 [LAST_SEEN] Comptage actuel en BDD: ${group.current_participants} vs réel: ${realParticipantCount}`);
          
          if (group.current_participants !== realParticipantCount) {
            await GroupOperationsService.updateGroupParticipantCount(group.id, realParticipantCount);
            group.current_participants = realParticipantCount;
          }

          console.log(`✅ [LAST_SEEN] Membres finaux avec statut de connexion:`, members.map(m => ({ name: m.name, connected: m.connected })));

          // Mise à jour du last_seen pour ce groupe
          await GroupMembersService.updateUserLastSeen(user.id, group.id);
          console.log(`✅ Last_seen mis à jour pour le groupe: ${group.id}`);

          return {
            ...group,
            members
          };
        })
      );

      const validGroups = groupsWithDetails.filter((group): group is Group => group !== null);
      console.log('📊 [LAST_SEEN] Groupes après correction complète:', validGroups);

      // Récupérer les membres pour chaque groupe
      const groupsWithMembers = await Promise.all(
        validGroups.map(async (group) => {
          console.log(`👥 [LAST_SEEN] Récupération des membres avec statut de connexion: ${group.id}`);
          const members = await GroupMembersService.getGroupMembersWithConnectionStatus(group.id);
          
          const realParticipantCount = members.filter(member => member.connected).length;
          console.log(`🔍 [LAST_SEEN] Nombre RÉEL de participants confirmés: ${realParticipantCount}`);
          
          console.log(`📊 [LAST_SEEN] Comptage actuel en BDD: ${group.current_participants} vs réel: ${realParticipantCount}`);
          
          console.log(`✅ [LAST_SEEN] Membres finaux avec statut de connexion:`, members.map(m => ({ name: m.name, connected: m.connected })));

          return {
            ...group,
            members
          };
        })
      );

      return groupsWithMembers;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des groupes:', error);
      throw error;
    }
  };

  // Query pour récupérer les groupes de l'utilisateur
  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['userGroups', user?.id],
    queryFn: fetchUserGroups,
    enabled: !!user,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  // Effet pour récupérer la géolocalisation au montage du composant
  useEffect(() => {
    if (user && !userLocation && !isGettingLocation.current) {
      console.log('🔄 Utilisateur détecté, chargement des groupes...');
      getUserLocation();
    }
  }, [user, userLocation]);

  // Fonction pour rejoindre un groupe aléatoire
  const joinRandomGroup = async (): Promise<boolean> => {
    if (loading) {
      console.log('🚫 Action bloquée - opération en cours');
      return false;
    }

    setLoading(true);
    clearActiveToasts(); // Nettoyer les anciens toasts

    try {
      // Récupérer la position utilisateur
      const location = await getUserLocation();

      console.log('🎲 Tentative de rejoindre un groupe aléatoire...');
      const success = await GroupOperationsService.joinRandomGroup(user!.id, location);

      if (success) {
        console.log('✅ Groupe rejoint avec succès !');
        showUniqueToast(
          'Votre groupe est en cours de formation. Vous serez redirigé automatiquement.',
          '🎉 Groupe trouvé !',
          'default'
        );
        
        // Rafraîchir les données
        await refetchGroups();
        return true;
      } else {
        console.log('❌ Aucun groupe disponible');
        showUniqueToast(
          'Aucun groupe disponible pour le moment. Un nouveau groupe sera créé automatiquement.',
          '⏳ Création en cours...',
          'default'
        );
        
        // Rafraîchir les données après un court délai
        setTimeout(async () => {
          await refetchGroups();
        }, 2000);
        
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche de groupe:', error);
      showUniqueToast(
        'Une erreur est survenue. Veuillez réessayer.',
        '❌ Erreur',
        'destructive'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    userGroups,
    loading: loading || groupsLoading,
    userLocation,
    joinRandomGroup,
    refetchGroups
  };
};
