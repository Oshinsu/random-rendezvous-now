import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useStorySubmission = () => {
  const [uploading, setUploading] = useState(false);

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('community-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Erreur lors du téléchargement du média');
      return null;
    }
  };

  const submitStory = async (storyData: {
    story_type: 'text' | 'photo' | 'video';
    content?: string;
    media?: File;
    city?: string;
    vibe?: string;
    group_id?: string;
  }) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let media_url = null;

      // Upload media if provided
      if (storyData.media) {
        media_url = await uploadMedia(storyData.media);
        if (!media_url) {
          throw new Error('Failed to upload media');
        }
      }

      // Insert story
      const { data, error } = await supabase
        .from('community_stories')
        .insert({
          user_id: user.id,
          story_type: storyData.story_type,
          content: storyData.content || null,
          media_url,
          city: storyData.city || null,
          vibe: storyData.vibe || null,
          group_id: storyData.group_id || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('🎉 Story soumise ! +50 crédits à l\'approbation', {
        description: 'Notre équipe va la vérifier rapidement'
      });

      return data;
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error('Erreur lors de la soumission');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (storyId: string, currentlyLiked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Connectez-vous pour liker');
        return false;
      }

      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('story_likes')
          .insert({
            story_id: storyId,
            user_id: user.id
          });

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Erreur lors du like');
      return false;
    }
  };

  return {
    submitStory,
    toggleLike,
    uploading,
  };
};
