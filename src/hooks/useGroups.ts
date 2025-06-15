
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupOperationsService } from '@/services/groupOperations';
import { GroupMembersService } from '@/services/groupMembers';
import { showUniqueToast, clearActiveToasts } from '@/utils/toastUtils';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
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
      const groups = await GroupMembersService.fetchGroupMembers(user.id);
      console.log('✅ Groupes trouvés:', groups.length);

      if (groups.length === 0) {
        setGroupMembers([]);
        return [];
      }

      // Pour chaque groupe, récupérer les membres
      const groupsWithMembers = await Promise.all(
        groups.map(async (group) => {
          console.log(`👥 [LAST_SEEN] Récupération des membres: ${group.id}`);
          const members = await GroupMembersService.fetchGroupMembers(group.id);
          
          // Mettre à jour les membres du premier groupe (groupe actuel)
          if (groups.indexOf(group) === 0) {
            setGroupMembers(members);
          }
          
          // Mise à jour du last_seen pour ce groupe
          await GroupMembersService.updateUserLastSeen(group.id, user.id);
          console.log(`✅ Last_seen mis à jour pour le groupe: ${group.id}`);

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
    if (!user) return false;
    
    // Récupérer la position utilisateur
    const location = await getUserLocation();
    
    return await GroupOperationsService.joinRandomGroup(user, location, loading, setLoading);
  };

  // Fonction pour quitter un groupe
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user) return;
    
    const clearUserGroupsState = () => {
      setGroupMembers([]);
      queryClient.setQueryData(['userGroups', user.id], []);
    };
    
    await GroupOperationsService.leaveGroup(groupId, user, loading, setLoading, clearUserGroupsState);
    await refetchGroups();
  };

  return {
    userGroups,
    groupMembers,
    loading: loading || groupsLoading,
    userLocation,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups,
    refetchGroups
  };
};
