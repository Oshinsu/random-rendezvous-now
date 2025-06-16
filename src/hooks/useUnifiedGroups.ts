
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

  // AMÉLIORATION: Cache de localisation avec expiration de 10 minutes
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    const now = Date.now();
    const locationCacheTime = 10 * 60 * 1000; // 10 minutes
    
    // Si on a une location récente et pas de force refresh, l'utiliser
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

  // AMÉLIORATION: Nettoyage forcé + invalidation cache + fetch strict
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) {
      return [];
    }

    try {
      console.log('🧹 NETTOYAGE FORCÉ avant recherche de groupes');
      
      // 1. Nettoyage agressif des groupes anciens
      await UnifiedGroupService.forceCleanupOldGroups();
      
      // 2. Invalider TOUS les caches liés aux groupes
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });
      queryClient.invalidateQueries({ queryKey: ['groupMembers'] });
      queryClient.invalidateQueries({ queryKey: ['groupMessages'] });
      
      // 3. Recherche stricte des participations actives SEULEMENT
      const participations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (participations.length === 0) {
        console.log('✅ Aucune participation active - état propre');
        setGroupMembers([]);
        return [];
      }

      // 4. Validation stricte: vérifier que les groupes sont vraiment actifs
      const validGroups: Group[] = [];
      for (const participation of participations) {
        const group = participation.groups;
        
        // Validation stricte des groupes
        if (group.status === 'waiting' || group.status === 'confirmed') {
          // Vérification supplémentaire: le groupe a-t-il été créé récemment ?
          const groupAge = Date.now() - new Date(group.created_at).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 heures
          
          if (groupAge < maxAge) {
            validGroups.push(group);
          } else {
            console.log('🗑️ Groupe trop ancien détecté:', group.id, 'âge:', Math.round(groupAge / (60 * 60 * 1000)), 'heures');
          }
        }
      }

      // 5. Si on a des groupes valides, récupérer les membres
      if (validGroups.length > 0) {
        const members = await UnifiedGroupService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
        
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
    refetchInterval: 15000, // Réduit à 15s pour plus de réactivité
    staleTime: 5000,
    // AMÉLIORATION: Force le refetch à chaque fois
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // AMÉLIORATION: Fonction de création de groupe complètement nouvelle
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
      console.log('🎯 DÉBUT - Création d\'un groupe TOTALEMENT frais');
      
      // 1. NETTOYAGE ULTRA AGRESSIF
      console.log('🧹 Nettoyage ultra agressif...');
      await UnifiedGroupService.forceCleanupOldGroups();
      
      // 2. INVALIDATION COMPLÈTE DU CACHE
      queryClient.clear(); // Supprime TOUT le cache
      setGroupMembers([]);
      setUserLocation(null); // Force une nouvelle géolocalisation
      
      // 3. GÉOLOCALISATION FRAÎCHE OBLIGATOIRE
      console.log('📍 Géolocalisation fraîche obligatoire...');
      const location = await getUserLocation(true); // Force refresh
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire pour créer un groupe frais.', 
          variant: 'destructive' 
        });
        return false;
      }

      // 4. VÉRIFICATION POST-NETTOYAGE
      console.log('🔍 Vérification post-nettoyage...');
      const postCleanupParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (postCleanupParticipations.length > 0) {
        console.log('⚠️ Participation résiduelle détectée après nettoyage');
        toast({ 
          title: 'Nettoyage en cours', 
          description: 'Veuillez réessayer dans quelques secondes.', 
          variant: 'destructive' 
        });
        return false;
      }

      // 5. RECHERCHE DE GROUPE COMPATIBLE STRICTE
      console.log('🌍 Recherche de groupe compatible dans un rayon strict de 10km...');
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(location);

      if (!targetGroup) {
        // 6. CRÉATION DE GROUPE TOTALEMENT NEUF
        console.log('🆕 Création d\'un groupe totalement neuf...');
        const newGroup = await UnifiedGroupService.createGroup(location, user.id);
        
        if (newGroup) {
          // 7. INVALIDATION ET REFETCH IMMÉDIAT
          queryClient.invalidateQueries({ queryKey: ['userGroups'] });
          setTimeout(() => refetchGroups(), 500); // Délai pour la propagation
          
          toast({ 
            title: '🎉 Nouveau groupe créé', 
            description: `Groupe frais créé à ${location.locationName}.`, 
          });
          return true;
        }
        return false;
      } else {
        // 8. REJOINDRE GROUPE EXISTANT
        console.log('🔗 Rejoindre groupe compatible existant...');
        const success = await UnifiedGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          // 9. INVALIDATION ET REFETCH IMMÉDIAT
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

  // AMÉLIORATION: Fonction de sortie avec nettoyage complet
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) {
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 Sortie de groupe avec nettoyage complet...');
      
      // 1. Nettoyage immédiat de l'état local
      setGroupMembers([]);
      queryClient.setQueryData(['userGroups', user.id], []);

      // 2. Sortie du groupe
      const success = await UnifiedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        // 3. Nettoyage complet du cache
        queryClient.clear();
        setUserLocation(null); // Reset location pour forcer une nouvelle géoloc
        
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe. Votre prochain groupe sera totalement frais.' 
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
