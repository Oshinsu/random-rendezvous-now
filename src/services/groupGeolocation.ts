
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { Group } from '@/types/database';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

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
      console.log('🌍 Recherche de groupe compatible avec filtres anti-zombies...');
      
      // NOUVEAU: Filtrer les groupes par âge (max 3 heures)
      const maxGroupAge = new Date(Date.now() - GROUP_CONSTANTS.MAX_GROUP_AGE_FOR_JOIN).toISOString();
      
      const { data: waitingGroups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 5)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gt('created_at', maxGroupAge) // NOUVEAU: Exclure groupes anciens
        .order('created_at', { ascending: false }); // NOUVEAU: Plus récents d'abord

      if (error) {
        console.error('❌ Erreur recherche groupes géolocalisés:', error);
        return null;
      }

      if (!waitingGroups || waitingGroups.length === 0) {
        console.log('📍 Aucun groupe FRAIS trouvé (âge < 3h)');
        return null;
      }

      console.log(`🔍 ${waitingGroups.length} groupes frais trouvés (âge < 3h)`);

      // NOUVEAU: Implémenter la priorité de création vs rejoint
      const shouldCreateNew = Math.random() < GROUP_CONSTANTS.CREATION_PRIORITY.CREATE_NEW_PROBABILITY;
      
      if (shouldCreateNew) {
        console.log('🎲 [PRIORITÉ CRÉATION] Décision de créer un nouveau groupe (70% chance)');
        return null; // Forcer la création d'un nouveau groupe
      }

      // Filtrer les groupes avec un minimum de participants (éviter les groupes avec 1 seul participant inactif)
      const viableGroups = waitingGroups.filter(group => 
        group.current_participants >= GROUP_CONSTANTS.CREATION_PRIORITY.MIN_PARTICIPANTS_TO_JOIN
      );

      // Si pas de groupes viables, créer un nouveau
      if (viableGroups.length === 0) {
        console.log('📍 Aucun groupe viable trouvé (min 2 participants) - création recommandée');
        return null;
      }

      // Chercher un groupe dans un rayon strict de 10km parmi les groupes viables
      const maxDistance = 10000; // 10km en mètres
      
      for (const group of viableGroups) {
        if (group.latitude && group.longitude) {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            group.latitude,
            group.longitude
          );
          
          if (distance <= maxDistance) {
            // Vérifier que le groupe est vraiment "frais" (moins d'1 heure)
            const groupAge = Date.now() - new Date(group.created_at).getTime();
            if (groupAge <= GROUP_CONSTANTS.CREATION_PRIORITY.FRESH_GROUP_MAX_AGE) {
              console.log(`✅ Groupe FRAIS compatible trouvé à ${Math.round(distance / 1000)}km (âge: ${Math.round(groupAge/60000)}min):`, group.id);
              return group as Group;
            } else {
              console.log(`⏰ Groupe trop ancien ignoré (âge: ${Math.round(groupAge/60000)}min):`, group.id);
            }
          }
        }
      }

      console.log('📍 Aucun groupe FRAIS et viable dans la zone géographique de 10km - création recommandée');
      return null;
    } catch (error) {
      console.error('❌ Erreur findCompatibleGroup:', error);
      return null;
    }
  }
}
