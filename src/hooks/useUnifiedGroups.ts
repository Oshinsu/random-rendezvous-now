
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
  const lastLocationTime = useRef<number>(0);

  // Cache de localisation avec expiration de 10 minutes
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    const now = Date.now();
    const locationCacheTime = 10 * 60 * 1000; // 10 minutes
    
    if (!forceRefresh && userLocation && (now - lastLocationTime.current) < locationCacheTime) {
      console.log('📍 Utilisation de la position en cache:', userLocation.locationName);
      return userLocation;
    }

    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    isGettingLocation.current = true;
    console.log('📍 Demande de géolocalisation FRAÎCHE');

    locationPromise.current = GeolocationService.getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
        lastLocationTime.current = now;
        showUniqueToast(
          `Position détectée: ${location.locationName}`,
          "📍 Position actualisée"
        );
        console.log('✅ Nouvelle position obtenue:', location);
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

  // CORRIGÉ: Pas de nettoyage automatique + invalidation cache contrôlée
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) {
      return [];
    }

    try {
      console.log('📋 Recherche des groupes utilisateur SANS nettoyage automatique');
      
      // 1. Recherche directe des participations actives
      const participations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (participations.length === 0) {
        console.log('✅ Aucune participation active');
        setGroupMembers([]);
        return [];
      }

      // 2. Extraction des groupes valides
      const validGroups: Group[] = participations.map(participation => participation.groups);

      // 3. Si on a des groupes valides, récupérer les membres et mettre à jour l'activité
      if (validGroups.length > 0) {
        const members = await UnifiedGroupService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
        
        // AMÉLIORATION: Mise à jour automatique de last_seen à chaque fetch
        await UnifiedGroupService.updateUserActivity(validGroups[0].id, user.id);
      }

      console.log('✅ Groupes valides trouvés:', validGroups.length);
      return validGroups;
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
    refetchInterval: 30000, // Augmenté à 30s pour réduire la charge
    staleTime: 15000, // Augmenté à 15s
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // CORRIGÉ: Fonction de création de groupe SANS nettoyage agressif
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
      console.log('🎯 DÉBUT - Recherche/Création de groupe SANS nettoyage agressif');
      
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

      // 2. Vérification légère des participations existantes
      console.log('🔍 Vérification légère des participations...');
      const participations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (participations.length > 0) {
        console.log('⚠️ Participation existante détectée');
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
          queryClient.invalidateQueries({ queryKey: ['userGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '🎉 Nouveau groupe créé', 
            description: `Groupe créé à ${location.locationName}.`, 
          });
          return true;
        }
        return false;
      } else {
        // 5. Rejoindre groupe existant
        console.log('🔗 Rejoindre groupe compatible existant...');
        const success = await UnifiedGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          queryClient.invalidateQueries({ queryKey: ['userGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe à ${location.locationName}.`, 
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

  // CORRIGÉ: Fonction de sortie avec nettoyage LOCAL seulement
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) {
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 Sortie de groupe avec nettoyage LOCAL...');
      
      // 1. Nettoyage immédiat de l'état local
      setGroupMembers([]);
      queryClient.setQueryData(['userGroups', user.id], []);

      // 2. Sortie du groupe
      const success = await UnifiedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        // 3. Invalidation contrôlée du cache
        queryClient.invalidateQueries({ queryKey: ['userGroups'] });
        
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
    refetchGroups
  };
};
