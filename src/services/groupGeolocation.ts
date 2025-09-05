
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
      console.log('🌍 Recherche de groupe compatible...');
      
      // Détection utilisateur IDF - rediriger vers Paris centre
      const isIdfUser = this.isUserInIleDeFrance(userLocation);
      const searchLocation = isIdfUser ? {
        latitude: 48.8566,   // Paris centre
        longitude: 2.3522,   // Paris centre
        locationName: 'Paris Centre'
      } : userLocation;
      
      if (isIdfUser) {
        console.log('🗺️ Utilisateur IDF détecté - recherche de groupes parisiens');
      }
      
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
        console.log('📍 Aucun groupe trouvé (âge < 3h)');
        return null;
      }

      console.log(`🔍 ${waitingGroups.length} groupes trouvés (âge < 3h)`);

      // Filtrer les groupes viables (âge et participants)
      const viableGroups = waitingGroups.filter(group => {
        const groupAge = Date.now() - new Date(group.created_at).getTime();
        return group.current_participants >= GROUP_CONSTANTS.GROUP_JOIN.MIN_PARTICIPANTS_TO_JOIN &&
               groupAge <= GROUP_CONSTANTS.GROUP_JOIN.MAX_GROUP_AGE;
      });

      // Si pas de groupes viables, créer un nouveau
      if (viableGroups.length === 0) {
        console.log('📍 Aucun groupe viable trouvé - création recommandée');
        return null;
      }

      // Chercher un groupe dans un rayon strict de 25km parmi les groupes viables
      const maxDistance = 25000; // 25km en mètres
      
      for (const group of viableGroups) {
        if (group.latitude && group.longitude) {
          const distance = this.calculateDistance(
            searchLocation.latitude,
            searchLocation.longitude,
            group.latitude,
            group.longitude
          );
          
          if (distance <= maxDistance) {
            const groupAge = Date.now() - new Date(group.created_at).getTime();
            console.log(`✅ Groupe compatible trouvé à ${Math.round(distance / 1000)}km (âge: ${Math.round(groupAge/60000)}min):`, group.id);
            return group as Group;
          }
        }
      }

      console.log('📍 Aucun groupe viable dans la zone géographique de 25km - création recommandée');
      return null;
     } catch (error) {
      console.error('❌ Erreur findCompatibleGroup:', error);
      return null;
    }
  }

  // Méthode pour détecter si un utilisateur est en Île-de-France
  private static isUserInIleDeFrance(location: LocationData): boolean {
    const locationName = location.locationName.toLowerCase();
    
    // Codes postaux IDF (75, 77, 78, 91, 92, 93, 94, 95)
    const idfPostalCodes = /\b(75\d{3}|77\d{3}|78\d{3}|91\d{3}|92\d{3}|93\d{3}|94\d{3}|95\d{3})\b/;
    
    // Départements IDF
    const idfDepartments = [
      'paris', 'seine-et-marne', 'yvelines', 'essonne', 'hauts-de-seine', 
      'seine-saint-denis', 'val-de-marne', 'val-d\'oise'
    ];
    
    // Villes principales IDF (liste exhaustive des communes importantes)
    const idfCities = [
      // Paris et grandes villes
      'paris', 'boulogne-billancourt', 'saint-denis', 'argenteuil', 'montreuil',
      'créteil', 'nanterre', 'courbevoie', 'versailles', 'vitry-sur-seine',
      'colombes', 'asnières-sur-seine', 'aulnay-sous-bois', 'rueil-malmaison',
      'aubervilliers', 'champigny-sur-marne', 'saint-maur-des-fossés',
      'drancy', 'issy-les-moulineaux', 'levallois-perret', 'antony',
      'noisy-le-grand', 'villeneuve-saint-georges', 'clichy', 'ivry-sur-seine',
      'villejuif', 'épinay-sur-seine', 'meaux', 'vincennes', 'bobigny',
      'le blanc-mesnil', 'rosny-sous-bois', 'fontenay-sous-bois', 'bondy',
      
      // Villes manquantes importantes (Hauts-de-Seine 92)
      'chaville', 'sceaux', 'bagneux', 'malakoff', 'montrouge', 'vanves',
      'châtillon', 'clamart', 'meudon', 'sèvres', 'ville-d\'avray', 'marnes-la-coquette',
      'garches', 'vaucresson', 'la-celle-saint-cloud', 'bourg-la-reine', 'sceaux',
      'fontenay-aux-roses', 'le-plessis-robinson', 'châtenay-malabry', 'antony',
      'wissous', 'fresnes', 'rungis', 'thiais', 'chevilly-larue', 'l\'haÿ-les-roses',
      'cachan', 'arcueil', 'gentilly', 'le-kremlin-bicêtre', 'villejuif',
      
      // Val-de-Marne (94)
      'saint-mandé', 'charenton-le-pont', 'maisons-alfort', 'alfortville',
      'saint-maurice', 'joinville-le-pont', 'nogent-sur-marne', 'le-perreux-sur-marne',
      'bry-sur-marne', 'chennevières-sur-marne', 'la-varenne-saint-hilaire',
      'villiers-sur-marne', 'champigny-sur-marne', 'saint-maur-des-fossés',
      
      // Seine-Saint-Denis (93)
      'pantin', 'les-lilas', 'le-pré-saint-gervais', 'bagnolet', 'romainville',
      'noisy-le-sec', 'rosny-sous-bois', 'villemomble', 'montfermeil',
      'gagny', 'le-raincy', 'clichy-sous-bois', 'livry-gargan', 'le bourget',
      
      // Val-d\'Oise (95)
      'enghien-les-bains', 'montmorency', 'eaubonne', 'ermont', 'franconville',
      'saint-gratien', 'sannois', 'argenteuil', 'bezons', 'colombes',
      
      // Yvelines (78)
      'le-chesnay', 'viroflay', 'chaville', 'meudon', 'issy-les-moulineaux',
      'boulogne-billancourt', 'saint-cloud', 'suresnes', 'puteaux', 'neuilly-sur-seine',
      
      // Essonne (91)
      'massy', 'palaiseau', 'orsay', 'gif-sur-yvette', 'bures-sur-yvette',
      'les-ulis', 'villebon-sur-yvette', 'verrières-le-buisson', 'chilly-mazarin',
      'longjumeau', 'savigny-sur-orge', 'viry-châtillon', 'juvisy-sur-orge'
    ];
    
    // Vérification par code postal
    if (idfPostalCodes.test(locationName)) {
      return true;
    }
    
    // Vérification par département
    if (idfDepartments.some(dept => locationName.includes(dept))) {
      return true;
    }
    
    // Vérification par ville
    if (idfCities.some(city => locationName.includes(city))) {
      return true;
    }
    
    return false;
  }
}
