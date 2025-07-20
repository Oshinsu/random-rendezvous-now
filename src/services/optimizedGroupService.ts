import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from './geolocation';
import { ErrorHandler } from '@/utils/errorHandling';
import { SystemMessagingService } from './systemMessaging';
import { AutomaticBarAssignmentService } from './automaticBarAssignment';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';
import { CoordinateValidator } from '@/utils/coordinateValidation';
import { PerformanceMetricsService } from './performanceMetrics';
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
 * Removes code duplication and improves performance
 */
export class OptimizedGroupService {
  private static locationCache = new Map<string, CacheEntry<LocationData>>();
  private static groupCache = new Map<string, CacheEntry<Group[]>>();
  
  // Performance tracking using dedicated service
  private static startMetrics(operation: string): { end: (success?: boolean, error?: string, cacheHit?: boolean) => void } {
    return PerformanceMetricsService.startOperation(operation);
  }

  // Get performance analytics
  static getPerformanceMetrics() {
    return PerformanceMetricsService.getAllMetrics();
  }

  // Clear old cache entries
  private static cleanCache<T>(cache: Map<string, CacheEntry<T>>): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        cache.delete(key);
      }
    }
  }

  // Enhanced location retrieval with caching and validation
  static async getLocationWithCache(userId: string, forceRefresh = false): Promise<LocationData | null> {
    const metrics = this.startMetrics('GET_LOCATION');
    
    try {
      this.cleanCache(this.locationCache);
      const cacheKey = `location_${userId}`;
      const locationCacheTTL = 10 * 60 * 1000; // 10 minutes
      
      if (!forceRefresh && this.locationCache.has(cacheKey)) {
        const cached = this.locationCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < cached.ttl) {
          // Validate cached coordinates
          const validation = CoordinateValidator.validateCoordinates(
            cached.data.latitude, 
            cached.data.longitude
          );
          
          if (validation.isValid) {
            console.log('📍 Using cached location:', cached.data.locationName);
            metrics.end(true, undefined, true);
            return cached.data;
          }
        }
      }

      const location = await GeolocationService.getCurrentLocation();
      
      // Cache the new location
      this.locationCache.set(cacheKey, {
        data: location,
        timestamp: Date.now(),
        ttl: locationCacheTTL
      });
      
      metrics.end(true, undefined, false);
      return location;
    } catch (error) {
      metrics.end(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Consolidated user authentication check
  static async verifyAuthentication(): Promise<{ user: any; isValid: boolean }> {
    const metrics = this.startMetrics('AUTH_CHECK');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        ErrorHandler.logError('AUTH_CHECK', error);
        metrics.end(false, error.message);
        return { user: null, isValid: false };
      }
      
      metrics.end(true);
      return { user, isValid: !!user };
    } catch (error) {
      ErrorHandler.logError('AUTH_VERIFICATION', error);
      metrics.end(false, error instanceof Error ? error.message : 'Unknown error');
      return { user: null, isValid: false };
    }
  }

  // Optimized participant count with single query
  static async getAndUpdateParticipantCount(groupId: string): Promise<number> {
    const metrics = this.startMetrics('PARTICIPANT_COUNT');
    
    try {
      const { data: participants, error } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (error) {
        metrics.end(false, error.message);
        throw error;
      }

      const realCount = participants?.length || 0;
      
      // Update group count in single operation
      const { error: updateError } = await supabase
        .from('groups')
        .update({ current_participants: realCount })
        .eq('id', groupId);
      
      if (updateError) {
        console.warn('Failed to update participant count:', updateError);
      }
      
      metrics.end(true);
      return realCount;
    } catch (error) {
      metrics.end(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Enhanced user groups retrieval with intelligent caching
  static async getUserGroups(userId: string, useCache = true): Promise<Group[]> {
    const metrics = this.startMetrics('GET_USER_GROUPS');
    
    try {
      this.cleanCache(this.groupCache);
      const cacheKey = `groups_${userId}`;
      const groupCacheTTL = 30 * 1000; // 30 seconds for groups (shorter due to dynamic nature)
      
      if (useCache && this.groupCache.has(cacheKey)) {
        const cached = this.groupCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < cached.ttl) {
          console.log('📋 Using cached groups:', cached.data.length);
          metrics.end(true, undefined, true);
          return cached.data;
        }
      }

      // Single optimized query with proper joins
      const { data: participations, error } = await supabase
        .from('group_participants')
        .select(`
          group_id,
          joined_at,
          last_seen,
          groups!inner(
            id,
            created_at,
            status,
            bar_name,
            bar_address,
            meeting_time,
            max_participants,
            current_participants,
            latitude,
            longitude,
            location_name,
            search_radius,
            bar_latitude,
            bar_longitude,
            bar_place_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed'])
        .order('joined_at', { ascending: false });

      if (error) {
        metrics.end(false, error.message);
        throw error;
      }

      // Process and validate groups
      const validGroups = (participations || [])
        .map(p => p.groups)
        .filter(group => {
          if (!group) return false;
          
          // Filter out very old groups (7 days)
          const groupAge = Date.now() - new Date(group.created_at).getTime();
          const maxAge = 7 * 24 * 60 * 60 * 1000;
          
          return groupAge <= maxAge;
        }) as Group[];

      // Cache the results
      this.groupCache.set(cacheKey, {
        data: validGroups,
        timestamp: Date.now(),
        ttl: groupCacheTTL
      });

      metrics.end(true);
      return validGroups;
    } catch (error) {
      metrics.end(false, error instanceof Error ? error.message : 'Unknown error');
      ErrorHandler.logError('GET_USER_GROUPS', error);
      return [];
    }
  }

  // Optimized group members with connection status
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const endMetrics = this.startMetrics('GET_GROUP_MEMBERS');
    
    try {
      const { data: participants, error } = await supabase
        .from('group_participants')
        .select('id, user_id, joined_at, status, last_seen')
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (error) {
        endMetrics.end(false);
        throw error;
      }

      const members: GroupMember[] = (participants || []).map((participant, index) => {
        const lastSeenDate = new Date(participant.last_seen || participant.joined_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
        const isConnected = diffMinutes <= 10; // Connected if seen within 10 minutes

        return {
          id: participant.id,
          name: `Rander ${index + 1}`,
          isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: participant.last_seen || participant.joined_at
        };
      });

      endMetrics.end(true);
      return members;
    } catch (error) {
      endMetrics.end(false);
      ErrorHandler.logError('GET_GROUP_MEMBERS', error);
      return [];
    }
  }

  // Optimized group creation with atomic transaction
  static async createGroup(location: LocationData, userId: string): Promise<Group | null> {
    const endMetrics = this.startMetrics('CREATE_GROUP');
    
    try {
      // Rate limiting check
      if (RateLimiter.isRateLimited(`group_creation_${userId}`, RATE_LIMITS.GROUP_CREATION)) {
        const status = RateLimiter.getStatus(`group_creation_${userId}`);
        const remainingMinutes = Math.ceil(status.remainingTime / 60000);
        
        toast({
          title: 'Trop de tentatives',
          description: `Veuillez attendre ${remainingMinutes} minute(s).`,
          variant: 'destructive'
        });
        endMetrics.end(false);
        return null;
      }

      // Use atomic database function for consistency
      const { data: result, error } = await supabase.rpc('create_group_with_participant', {
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_location_name: location.locationName,
        p_user_id: userId
      });

      if (error) {
        endMetrics.end(false);
        console.error('❌ Atomic group creation failed:', error);
        
        if (error.message.includes('User is already in an active group')) {
          toast({
            title: 'Participation limitée',
            description: 'Vous ne pouvez être que dans un seul groupe actif.',
            variant: 'destructive'
          });
        } else {
          const appError = ErrorHandler.handleSupabaseError(error);
          ErrorHandler.showErrorToast(appError);
        }
        return null;
      }

      if (!result || result.length === 0) {
        endMetrics.end(false);
        return null;
      }

      const newGroup = result[0] as Group;
      
      // Clear cache for this user
      this.groupCache.delete(`groups_${userId}`);
      
      endMetrics.end(true);
      return newGroup;
    } catch (error) {
      endMetrics.end(false);
      ErrorHandler.logError('CREATE_GROUP_ATOMIC', error);
      return null;
    }
  }

  // Optimized group joining with validation
  static async joinGroup(groupId: string, userId: string, location: LocationData): Promise<boolean> {
    const endMetrics = this.startMetrics('JOIN_GROUP');
    
    try {
      // Rate limiting check
      if (RateLimiter.isRateLimited(`group_join_${userId}`, RATE_LIMITS.GROUP_JOIN)) {
        toast({
          title: 'Trop de tentatives',
          description: 'Veuillez attendre avant de rejoindre un groupe.',
          variant: 'destructive'
        });
        endMetrics.end(false);
        return false;
      }

      // Validate group availability in single query
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, status, current_participants, max_participants')
        .eq('id', groupId)
        .eq('status', 'waiting')
        .lt('current_participants', 5)
        .single();

      if (groupError || !group) {
        endMetrics.end(false);
        toast({
          title: 'Groupe indisponible',
          description: 'Ce groupe n\'est plus disponible.',
          variant: 'destructive'
        });
        return false;
      }

      // Insert participant with proper validation
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: userId,
          status: 'confirmed',
          last_seen: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: location.locationName
        });

      if (joinError) {
        endMetrics.end(false);
        const appError = ErrorHandler.handleSupabaseError(joinError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      // Clear cache for this user
      this.groupCache.delete(`groups_${userId}`);
      
      endMetrics.end(true);
      return true;
    } catch (error) {
      endMetrics.end(false);
      ErrorHandler.logError('JOIN_GROUP', error);
      return false;
    }
  }

  // Optimized group leaving
  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const endMetrics = this.startMetrics('LEAVE_GROUP');
    
    try {
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        endMetrics.end(false);
        ErrorHandler.logError('LEAVE_GROUP', error);
        return false;
      }

      // Clear cache for this user
      this.groupCache.delete(`groups_${userId}`);
      
      endMetrics.end(true);
      return true;
    } catch (error) {
      endMetrics.end(false);
      ErrorHandler.logError('LEAVE_GROUP', error);
      return false;
    }
  }

  // Update user activity with optimized query
  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    const endMetrics = this.startMetrics('UPDATE_ACTIVITY');
    
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        ErrorHandler.logError('UPDATE_LAST_SEEN', error);
        endMetrics.end(false);
      } else {
        endMetrics.end(true);
      }
    } catch (error) {
      endMetrics.end(false);
      ErrorHandler.logError('UPDATE_USER_ACTIVITY', error);
    }
  }

  // Smart cleanup with safety measures
  static async performSmartCleanup(): Promise<void> {
    const endMetrics = this.startMetrics('SMART_CLEANUP');
    
    try {
      console.log('🧹 Starting smart cleanup with safety measures');
      
      // Call the database function for safe cleanup
      const { error } = await supabase.rpc('dissolve_old_groups');
      
      if (error) {
        console.error('❌ Smart cleanup error:', error);
        endMetrics.end(false);
      } else {
        console.log('✅ Smart cleanup completed');
        
        // Clear all caches after cleanup
        this.groupCache.clear();
        
        endMetrics.end(true);
      }
    } catch (error) {
      endMetrics.end(false);
      ErrorHandler.logError('SMART_CLEANUP', error);
    }
  }

  // Cache management
  static clearAllCaches(): void {
    this.locationCache.clear();
    this.groupCache.clear();
    console.log('🗑️ All caches cleared');
  }

  // Get cache statistics
  static getCacheStats() {
    return {
      locationCacheSize: this.locationCache.size,
      groupCacheSize: this.groupCache.size,
      performanceMetricsCount: PerformanceMetricsService.getAllMetrics().length
    };
  }
}
