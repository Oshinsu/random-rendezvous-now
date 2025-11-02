import { Heart, Share2, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommunityStory } from '@/hooks/useCommunityStories';
import { useStorySubmission } from '@/hooks/useStorySubmission';
import { useState } from 'react';
import { toast } from 'sonner';

interface StoryCardProps {
  story: CommunityStory;
  onLikeUpdate?: () => void;
}

export const StoryCard = ({ story, onLikeUpdate }: StoryCardProps) => {
  const { toggleLike } = useStorySubmission();
  const [isLiked, setIsLiked] = useState(story.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(story.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const newLikedState = !isLiked;
    
    // Optimistic update
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    const success = await toggleLike(story.id, isLiked);
    
    if (!success) {
      // Revert on failure
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
    }
    
    setIsLiking(false);
    onLikeUpdate?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Random Community',
          text: story.content || 'Découvre cette story Random !',
          url: window.location.href,
        });
        toast.success('Merci du partage ! 🎉');
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié ! 📋');
    }
  };

  const renderMedia = () => {
    if (story.story_type === 'video' && story.media_url) {
      return (
        <video
          src={story.media_url}
          className="w-full h-full object-cover rounded-t-2xl"
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }

    if (story.story_type === 'photo' && story.media_url) {
      return (
        <img
          src={story.media_url}
          alt="Story"
          className="w-full h-full object-cover rounded-t-2xl"
          loading="lazy"
        />
      );
    }

    return null;
  };

  return (
    <Card className="overflow-hidden group hover:shadow-glow transition-all duration-300 border-border/50 bg-card/95 backdrop-blur-sm">
      {/* Media Section */}
      {(story.story_type === 'photo' || story.story_type === 'video') && (
        <div className="relative aspect-[4/5] overflow-hidden">
          {renderMedia()}
          
          {/* Verified Badge */}
          <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm border-0">
            ✓ Vérifié Random
          </Badge>

          {/* City Badge */}
          {story.city && (
            <Badge variant="secondary" className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm">
              <MapPin className="w-3 h-3 mr-1" />
              {story.city}
            </Badge>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {story.content && (
          <p className="text-sm text-foreground/90 leading-relaxed">
            {story.content}
          </p>
        )}

        {/* Author */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {story.profiles?.first_name || 'Membre Random'} · {new Date(story.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
          {story.vibe && (
            <Badge variant="outline" className="text-xs">
              {story.vibe}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={`gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">{likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="gap-2 text-muted-foreground"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs font-medium">Partager</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
