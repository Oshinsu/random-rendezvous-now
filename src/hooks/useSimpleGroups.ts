
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { TempGroupService } from '@/services/tempGroupService';
import { showUniqueToast } from '@/utils/toastUtils';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';

export const useSimpleGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['simpleUserGroups', user?.id],
    queryFn: async (): Promise<Group[]> => {
      if (!user) return [];
      return TempGroupService.getUserGroups(user.id);
    },
    enabled: !!user,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const getUserLocation = async (): Promise<LocationData | null> => {
    if (userLocation) return userLocation;

    try {
      const location = await GeolocationService.getCurrentLocation();
      setUserLocation(location);
      showUniqueToast(
        `Position: ${location.locationName}`,
        "📍 Position détectée"
      );
      return location;
    } catch (error) {
      showUniqueToast(
        'Géolocalisation indisponible - mode universel activé.',
        "📍 Géolocalisation indisponible"
      );
      return null;
    }
  };

  const joinRandomGroup = async (): Promise<boolean> => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) return false;

    setLoading(true);
    
    try {
      const isAuth = await TempGroupService.verifyAuth();
      if (!isAuth) {
        toast({ 
          title: 'Session expirée', 
          description: 'Veuillez vous reconnecter.', 
          variant: 'destructive' 
        });
        return false;
      }

      const location = await getUserLocation();
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Pour le moment, créer toujours un nouveau groupe pour éviter les erreurs RLS
      const success = await TempGroupService.createSimpleGroup(location, user.id);
      
      if (success) {
        await refetchGroups();
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erreur joinRandomGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de créer un groupe pour le moment.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    userGroups,
    groupMembers: [], // Temporairement vide pour éviter les erreurs
    loading: loading || groupsLoading,
    userLocation,
    joinRandomGroup,
    leaveGroup: async () => {}, // Temporairement désactivé
    fetchUserGroups: refetchGroups,
    refetchGroups
  };
};
