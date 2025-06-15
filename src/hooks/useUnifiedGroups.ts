
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from '@/services/groupGeolocation';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { ErrorHandler } from '@/utils/errorHandling';
import { showUniqueToast } from '@/utils/toastUtils';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useUnifiedGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData> | null>(null);

  const getUserLocation = async (): Promise<LocationData | null> => {
    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    if (userLocation) {
      return userLocation;
    }

    isGettingLocation.current = true;

    locationPromise.current = GeolocationService.getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
        showUniqueToast(
          `Localisation: ${location.locationName}. Recherche dans un rayon de 10km.`,
          "📍 Position détectée"
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

  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) {
      return [];
    }

    try {
      const participations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (participations.length === 0) {
        setGroupMembers([]);
        return [];
      }

      const groups: Group[] = participations.map(participation => participation.groups);
      
      if (groups.length > 0) {
        const members = await UnifiedGroupService.getGroupMembers(groups[0].id);
        setGroupMembers(members);
        
        await UnifiedGroupService.updateUserActivity(groups[0].id, user.id);
      }

      return groups;
    } catch (error) {
      ErrorHandler.logError('FETCH_USER_GROUPS', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return [];
    }
  };

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

  // Suppression de l'useEffect qui déclenchait la géolocalisation automatiquement

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

    // SEULEMENT maintenant on demande la géolocalisation
    console.log('🎯 Demande de géolocalisation déclenchée par le bouton');
    const location = await getUserLocation();
    if (!location) {
      toast({ 
        title: 'Géolocalisation requise', 
        description: 'Votre position est nécessaire pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    setLoading(true);
    
    try {
      await UnifiedGroupService.forceCleanupOldGroups();

      const participations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (participations.length > 0) {
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif !', 
          variant: 'destructive' 
        });
        return false;
      }

      const targetGroup = await GroupGeolocationService.findCompatibleGroup(location);

      if (!targetGroup) {
        const newGroup = await UnifiedGroupService.createGroup(location, user.id);
        
        if (newGroup) {
          toast({ 
            title: '🎉 Nouveau groupe créé', 
            description: `Groupe créé dans votre zone (${location.locationName}).`, 
          });
          return true;
        }
        return false;
      } else {
        const success = await UnifiedGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe dans votre zone.`, 
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

  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) {
      return;
    }

    setLoading(true);
    try {
      setGroupMembers([]);
      queryClient.setQueryData(['userGroups', user.id], []);

      const success = await UnifiedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe avec succès.' 
        });
        await refetchGroups();
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
    refetchGroups
  };
};
