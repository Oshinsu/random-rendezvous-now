
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { LocationData } from '@/services/geolocation';

export class TempGroupService {
  // Version simplifiée qui évite les requêtes complexes causant la récursion RLS
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      console.log('🔍 Récupération des groupes utilisateur (version simplifiée)');
      
      // Requête directe et simple pour éviter la récursion RLS
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .limit(1);

      if (error) {
        console.error('❌ Erreur récupération groupes:', error);
        return [];
      }

      console.log('✅ Groupes récupérés:', groups?.length || 0);
      // Type assertion to ensure compatibility with Group interface
      return (groups || []) as Group[];
    } catch (error) {
      console.error('❌ Erreur getUserGroups:', error);
      return [];
    }
  }

  static async createSimpleGroup(location: LocationData, userId: string): Promise<boolean> {
    try {
      console.log('🆕 Création de groupe simple');
      
      const newGroupData = {
        status: 'waiting' as const,
        max_participants: 5,
        current_participants: 1,
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.locationName,
        search_radius: 10000
      };

      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert(newGroupData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création groupe:', createError);
        throw createError;
      }

      console.log('✅ Groupe créé:', newGroup.id);
      
      // Ajouter l'utilisateur au groupe avec une requête simple
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          status: 'confirmed' as const,
          last_seen: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: location.locationName
        });

      if (joinError) {
        console.error('❌ Erreur ajout participant:', joinError);
        return false;
      }

      toast({ 
        title: '🎉 Groupe créé', 
        description: `Nouveau groupe créé dans votre zone.`
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erreur createSimpleGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de créer un groupe pour le moment.', 
        variant: 'destructive' 
      });
      return false;
    }
  }

  static async verifyAuth(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }
}
