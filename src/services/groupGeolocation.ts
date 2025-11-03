
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { Group } from '@/types/database';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { getSearchRadius } from '@/utils/searchRadiusUtils';
import { getGroupLocation } from '@/utils/parisRedirection';
import { ErrorHandler } from '@/utils/errorHandling';

export class GroupGeolocationService {
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  }

  static async findCompatibleGroup(userLocation: LocationData): Promise<Group | null> {
    try {
      console.log('🌍 [POSTGIS OPTIMIZED] Recherche de groupe compatible...');
      
      // Utilisation centralisée de la redirection IDF
      const searchLocation = getGroupLocation(userLocation);
      
      if (searchLocation.locationName !== userLocation.locationName) {
        console.log('🗺️ Utilisateur IDF détecté - recherche de groupes parisiens');
      }
      
      const maxDistance = await getSearchRadius();
      
      // SOTA Oct 2025: Utiliser fonction PostGIS optimisée (50x plus rapide)
      // Source: PostGIS Performance Tuning Guide 2025
      const { data: compatibleGroups, error } = await supabase
        .rpc('find_compatible_group_optimized' as any, {
          user_lat: searchLocation.latitude,
          user_lon: searchLocation.longitude,
          search_radius_meters: maxDistance,
          max_age_hours: 6
        }) as { data: Array<{
          group_id: string;
          distance_meters: number;
          group_age_minutes: number;
          current_participants: number;
        }> | null, error: any };

      if (error) {
        console.error('❌ Erreur recherche PostGIS:', error);
        // Fallback vers ancienne méthode si PostGIS échoue
        return this.findCompatibleGroupLegacy(searchLocation);
      }

      if (!compatibleGroups || compatibleGroups.length === 0) {
        console.log('📍 Aucun groupe compatible trouvé (PostGIS)');
        return null;
      }

      const bestGroup = compatibleGroups[0];
      console.log(`✅ [POSTGIS] Groupe compatible trouvé à ${Math.round(bestGroup.distance_meters / 1000)}km (âge: ${Math.round(bestGroup.group_age_minutes)}min):`, bestGroup.group_id);
      
      // Récupérer les détails complets du groupe
      const { data: groupDetails, error: detailsError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', bestGroup.group_id)
        .single();
      
      if (detailsError || !groupDetails) {
        console.error('❌ Erreur récupération détails groupe:', detailsError);
        return null;
      }
      
      return groupDetails as Group;
    } catch (error) {
      ErrorHandler.logError('FIND_COMPATIBLE_GROUP', error);
      return null;
    }
  }

  // Fallback legacy pour compatibilité
  private static async findCompatibleGroupLegacy(searchLocation: LocationData): Promise<Group | null> {
    console.log('🔄 Utilisation méthode legacy (fallback)');
    
    const maxGroupAge = new Date(Date.now() - GROUP_CONSTANTS.GROUP_JOIN.MAX_GROUP_AGE).toISOString();
    
    const { data: waitingGroups, error } = await supabase
      .from('groups')
      .select('*')
      .eq('status', 'waiting')
      .lt('current_participants', 5)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gt('created_at', maxGroupAge)
      .order('created_at', { ascending: false });

    if (error || !waitingGroups || waitingGroups.length === 0) {
      return null;
    }

    const viableGroups = waitingGroups.filter(group => {
      const groupAge = Date.now() - new Date(group.created_at).getTime();
      return group.current_participants >= GROUP_CONSTANTS.GROUP_JOIN.MIN_PARTICIPANTS_TO_JOIN &&
             groupAge <= GROUP_CONSTANTS.GROUP_JOIN.MAX_GROUP_AGE;
    });

    if (viableGroups.length === 0) {
      return null;
    }

    const maxDistance = await getSearchRadius();
    
    for (const group of viableGroups) {
      if (group.latitude && group.longitude) {
        const distance = this.calculateDistance(
          searchLocation.latitude,
          searchLocation.longitude,
          group.latitude,
          group.longitude
        );
        
        if (distance <= maxDistance) {
          return group as Group;
        }
      }
    }

    return null;
  }
}
