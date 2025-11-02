-- Create community_stories table for user-generated content
CREATE TABLE public.community_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_type TEXT NOT NULL CHECK (story_type IN ('text', 'photo', 'video')),
  content TEXT,
  media_url TEXT,
  media_thumbnail_url TEXT,
  city TEXT,
  vibe TEXT,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  sentiment_score NUMERIC,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_community_stories_status ON public.community_stories(status);
CREATE INDEX idx_community_stories_user_id ON public.community_stories(user_id);
CREATE INDEX idx_community_stories_created_at ON public.community_stories(created_at DESC);
CREATE INDEX idx_community_stories_city ON public.community_stories(city);
CREATE INDEX idx_community_stories_likes ON public.community_stories(likes_count DESC);

-- Create story_likes table for tracking user likes
CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.community_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX idx_story_likes_user_id ON public.story_likes(user_id);

-- Enable Row Level Security
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_stories
CREATE POLICY "Anyone can view approved stories"
  ON public.community_stories
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can create stories"
  ON public.community_stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stories"
  ON public.community_stories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending stories"
  ON public.community_stories
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all stories"
  ON public.community_stories
  FOR ALL
  USING (is_admin_user());

-- RLS Policies for story_likes
CREATE POLICY "Anyone can view likes"
  ON public.story_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like stories"
  ON public.story_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.story_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update likes_count
CREATE OR REPLACE FUNCTION update_story_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_stories 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_stories 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER story_likes_count_trigger
AFTER INSERT OR DELETE ON public.story_likes
FOR EACH ROW
EXECUTE FUNCTION update_story_likes_count();

-- Function to update updated_at timestamp
CREATE TRIGGER update_community_stories_updated_at
BEFORE UPDATE ON public.community_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for community media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- Storage policies for community-media bucket
CREATE POLICY "Anyone can view community media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'community-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'community-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable realtime for community_stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_stories;