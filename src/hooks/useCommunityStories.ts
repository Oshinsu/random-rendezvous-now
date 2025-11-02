import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface CommunityStory {
  id: string;
  user_id: string;
  story_type: string;
  content: string | null;
  media_url: string | null;
  media_thumbnail_url: string | null;
  city: string | null;
  vibe: string | null;
  group_id: string | null;
  status: string;
  likes_count: number;
  shares_count: number;
  sentiment_score: number | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
  user_has_liked?: boolean;
}

interface UseStoriesOptions {
  city?: string;
  vibe?: string;
  limit?: number;
  includeUserLikes?: boolean;
}

export const useCommunityStories = (options: UseStoriesOptions = {}) => {
  const { city, vibe, limit = 20, includeUserLikes = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['community-stories', city, vibe, limit],
    queryFn: async () => {
      let query = supabase
        .from('community_stories')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (city) {
        query = query.eq('city', city);
      }

      if (vibe) {
        query = query.eq('vibe', vibe);
      }

      const { data: stories, error: storiesError } = await query;

      if (storiesError) throw storiesError;

      if (!stories) return [];

      // Get profiles separately
      const userIds = [...new Set(stories.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Get user likes if authenticated
      let likedIds = new Set<string>();
      if (includeUserLikes) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && stories) {
          const storyIds = stories.map(s => s.id);
          const { data: likes } = await supabase
            .from('story_likes')
            .select('story_id')
            .eq('user_id', user.id)
            .in('story_id', storyIds);

          likedIds = new Set(likes?.map(l => l.story_id) || []);
        }
      }

      return stories.map(story => ({
        ...story,
        profiles: profilesMap.get(story.user_id),
        user_has_liked: likedIds.has(story.id)
      }));
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('community-stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_stories',
          filter: 'status=eq.approved'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    stories: data || [],
    isLoading,
    error,
    refetch,
  };
};
