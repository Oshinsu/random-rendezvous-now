
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { Group } from '@/types/database';

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
          const distance = this.calculateDistance(
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
  }
}
