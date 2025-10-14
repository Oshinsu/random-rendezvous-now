-- Create blog_keywords table
CREATE TABLE public.blog_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  last_used_at TIMESTAMP WITH TIME ZONE,
  times_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create blog_articles table
CREATE TABLE public.blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES public.blog_keywords(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
  views_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by_ai BOOLEAN NOT NULL DEFAULT true
);

-- Create blog_generation_schedule table
CREATE TABLE public.blog_generation_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency_days INTEGER NOT NULL DEFAULT 2 CHECK (frequency_days >= 1),
  last_generation_at TIMESTAMP WITH TIME ZONE,
  next_generation_at TIMESTAMP WITH TIME ZONE,
  total_generated INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default schedule configuration
INSERT INTO public.blog_generation_schedule (is_active, frequency_days, next_generation_at)
VALUES (false, 2, now() + interval '2 days');

-- Enable RLS
ALTER TABLE public.blog_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_generation_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_keywords
CREATE POLICY "Admins can manage keywords"
  ON public.blog_keywords
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- RLS Policies for blog_articles
CREATE POLICY "Anyone can view published articles"
  ON public.blog_articles
  FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

CREATE POLICY "Admins can manage articles"
  ON public.blog_articles
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- RLS Policies for blog_generation_schedule
CREATE POLICY "Admins can manage schedule"
  ON public.blog_generation_schedule
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Create indexes for performance
CREATE INDEX idx_blog_keywords_status ON public.blog_keywords(status);
CREATE INDEX idx_blog_keywords_priority ON public.blog_keywords(priority DESC);
CREATE INDEX idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX idx_blog_articles_published_at ON public.blog_articles(published_at DESC);
CREATE INDEX idx_blog_articles_slug ON public.blog_articles(slug);

-- Function to update article views
CREATE OR REPLACE FUNCTION increment_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_articles
  SET views_count = views_count + 1
  WHERE id = article_id;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_blog_article_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blog_articles_updated_at
  BEFORE UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_article_updated_at();