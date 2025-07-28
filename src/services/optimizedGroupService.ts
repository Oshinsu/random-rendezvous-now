import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from './geolocation';
import { ErrorHandler } from '@/utils/errorHandling';
import { SystemMessagingService } from './systemMessaging';
import { AutomaticBarAssignmentService } from './automaticBarAssignment';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';
import { CoordinateValidator } from '@/utils/coordinateValidation';
import { toast } from '@/hooks/use-toast';
import type { Group, GroupParticipant } from '@/types/database';
import type { GroupMember } from '@/types/groups';

// Cache interface for location and group data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Optimized Group Service with consolidated functionality
 * Simplified without performance metrics
 */
export class OptimizedGroupService {
  private static locationCache = new Map<string, CacheEntry<LocationData>>();
  private static groupCache = new Map<string, CacheEntry<Group[]>>();
  
  // Clear old cache entries
  private static cleanCache<T>(cache: Map<string, CacheEntry<T>>): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
      }
    }
  }

  // Get user location with caching
  static async getUserLocation(): Promise<LocationData | null> {
    try {
      const cacheKey = 'user_location';
      this.cleanCache(this.locationCache);
      
      // Check cache first
      const cached = this.locationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log('📍 Using cached location');
        return cached.data;
      }

      // Get fresh location
      console.log('📍 Getting fresh location...');
      const location = await GeolocationService.getCurrentPosition();
      
      if (location) {
        // Cache for 10 minutes
        this.locationCache.set(cacheKey, {
          data: location,
          timestamp: Date.now(),
          ttl: 10 * 60 * 1000
        });
      }
      
      return location;
    } catch (error) {
      console.warn('❌ Failed to get user location:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async checkUserAuth(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth check failed:', error.message);
        return false;
      }
      
      return !!user;
    } catch (error) {
      console.error('❌ Unexpected auth error:', error);
      return false;
    }
  }

  // Get participant count for a group
  static async getParticipantCount(groupId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId);

      if (error) {
        console.error(`❌ Failed to get participants for group ${groupId}:`, error.message);
        return 0;
      }

      return data.length;
    } catch (error) {
      console.error('❌ Unexpected error getting participant count:', error);
      return 0;
    }
  }

  // Get user groups with caching
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const cacheKey = `user_groups_${userId}`;
      this.cleanCache(this.groupCache);
      
      // Check cache first
      const cached = this.groupCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log('📚 Using cached groups');
        return cached.data;
      }

      // Get fresh data
      const { data: participantData, error: participantError } = await supabase
        .from('group_participants')
        .select('group_id')
        .eq('user_id', userId);

      if (participantError) {
        console.error('❌ Failed to get user groups:', participantError.message);
        return [];
      }

      if (!participantData || participantData.length === 0) {
        console.log('👤 No groups found for user');
        return [];
      }

      const groupIds = participantData.map(p => p.group_id);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('❌ Failed to get group details:', groupsError.message);
        return [];
      }

      const groups = groupsData || [];
      
      // Cache for 2 minutes
      this.groupCache.set(cacheKey, {
        data: groups,
        timestamp: Date.now(),
        ttl: 2 * 60 * 1000
      });
      
      console.log(`📚 Retrieved ${groups.length} groups for user`);
      return groups;
    } catch (error) {
      console.error('❌ Unexpected error getting user groups:', error);
      return [];
    }
  }

  // Get group members
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          user_id,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (error) {
        console.error(`❌ Failed to get members for group ${groupId}:`, error.message);
        return [];
      }

      return data.map(participant => ({
        id: participant.user_id,
        display_name: participant.profiles?.display_name || 'Anonyme',
        avatar_url: participant.profiles?.avatar_url || null
      }));
    } catch (error) {
      console.error('❌ Unexpected error getting group members:', error);
      return [];
    }
  }

  // Create a new group
  static async createGroup(userId: string, location?: LocationData): Promise<string | null> {
    try {
      if (!await RateLimiter.checkRateLimit(userId, RATE_LIMITS.GROUP_CREATION)) {
        toast({
          title: "Trop rapide !",
          description: "Attendez un moment avant de créer un nouveau groupe.",
          variant: "destructive",
        });
        return null;
      }

      const groupData = {
        created_by: userId,
        current_participants: 1,
        max_participants: 5,
        status: 'waiting' as const,
        latitude: location?.coords.latitude || null,
        longitude: location?.coords.longitude || null
      };

      const { data, error } = await supabase
        .from('groups')
        .insert(groupData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Failed to create group:', error.message);
        return null;
      }

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('group_participants')
        .insert({
          group_id: data.id,
          user_id: userId
        });

      if (participantError) {
        console.error('❌ Failed to add creator as participant:', participantError.message);
        return null;
      }

      console.log(`✅ Group ${data.id} created successfully`);
      return data.id;
    } catch (error) {
      console.error('❌ Unexpected error creating group:', error);
      return null;
    }
  }

  // Join an existing group
  static async joinGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      if (!await RateLimiter.checkRateLimit(userId, RATE_LIMITS.GROUP_JOINING)) {
        toast({
          title: "Trop rapide !",
          description: "Attendez un moment avant de rejoindre un autre groupe.",
          variant: "destructive",
        });
        return false;
      }

      // Check if group exists and has space
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, max_participants, status')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error(`❌ Failed to get group ${groupId}:`, groupError.message);
        return false;
      }

      if (group.current_participants >= group.max_participants) {
        console.log(`❌ Group ${groupId} is full`);
        return false;
      }

      // Add user to group
      const { error: participantError } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: userId
        });

      if (participantError) {
        if (participantError.code === '23505') {
          console.log(`👤 User already in group ${groupId}`);
          return true;
        }
        console.error('❌ Failed to join group:', participantError.message);
        return false;
      }

      console.log(`✅ Successfully joined group ${groupId}`);
      return true;
    } catch (error) {
      console.error('❌ Unexpected error joining group:', error);
      return false;
    }
  }

  // Leave a group
  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error(`❌ Failed to leave group ${groupId}:`, error.message);
        return false;
      }

      console.log(`✅ Successfully left group ${groupId}`);
      return true;
    } catch (error) {
      console.error('❌ Unexpected error leaving group:', error);
      return false;
    }
  }

  // Update user activity
  static async updateUserActivity(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_activity')
        .upsert({
          user_id: userId,
          last_activity: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to update user activity:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Unexpected error updating user activity:', error);
      return false;
    }
  }

  // Smart cleanup of inactive groups
  static async performSmartCleanup(): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .lt('created_at', cutoffTime)
        .neq('status', 'confirmed');

      if (error) {
        console.error('❌ Cleanup failed:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Unexpected cleanup error:', error);
      return false;
    }
  }

  // Clear all caches
  static clearCaches(): void {
    this.locationCache.clear();
    this.groupCache.clear();
    console.log('🗑️ All caches cleared');
  }

  // Get cache statistics
  static getCacheStats() {
    return {
      locationCacheSize: this.locationCache.size,
      groupCacheSize: this.groupCache.size
    };
  }
}