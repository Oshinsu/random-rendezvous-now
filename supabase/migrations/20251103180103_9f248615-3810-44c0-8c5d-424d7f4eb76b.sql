-- Phase 2: Create cms_page_analytics table
CREATE TABLE IF NOT EXISTS public.cms_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_section TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'conversion', 'bounce')),
  event_metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_analytics_section ON public.cms_page_analytics(page_section);
CREATE INDEX IF NOT EXISTS idx_cms_analytics_created_at ON public.cms_page_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_cms_analytics_event_type ON public.cms_page_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_cms_analytics_session ON public.cms_page_analytics(session_id);

-- RLS Policies
ALTER TABLE public.cms_page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
  ON public.cms_page_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
  ON public.cms_page_analytics
  FOR SELECT
  USING (is_admin_user());

-- Materialized view for aggregated data
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cms_engagement_summary AS
SELECT 
  page_section,
  event_type,
  DATE(created_at) as event_date,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM public.cms_page_analytics
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY page_section, event_type, DATE(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_engagement_summary 
  ON public.cms_engagement_summary(page_section, event_type, event_date);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_cms_engagement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.cms_engagement_summary;
END;
$$;

-- Phase 3: Create cms_seo_scores table
CREATE TABLE IF NOT EXISTS public.cms_seo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.site_content(id) ON DELETE CASCADE,
  readability_score INTEGER NOT NULL CHECK (readability_score >= 0 AND readability_score <= 100),
  keyword_density INTEGER NOT NULL CHECK (keyword_density >= 0 AND keyword_density <= 100),
  length_score INTEGER NOT NULL CHECK (length_score >= 0 AND length_score <= 100),
  cta_score INTEGER NOT NULL CHECK (cta_score >= 0 AND cta_score <= 100),
  emoji_score INTEGER NOT NULL CHECK (emoji_score >= 0 AND emoji_score <= 100),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cms_seo_content ON public.cms_seo_scores(content_id);
CREATE INDEX IF NOT EXISTS idx_cms_seo_calculated ON public.cms_seo_scores(calculated_at DESC);

-- RLS Policies
ALTER TABLE public.cms_seo_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view SEO scores"
  ON public.cms_seo_scores
  FOR SELECT
  USING (is_admin_user());

CREATE POLICY "System can manage SEO scores"
  ON public.cms_seo_scores
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);