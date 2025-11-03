-- Create blog_generation_logs table for monitoring
CREATE TABLE IF NOT EXISTS blog_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  keyword_id UUID REFERENCES blog_keywords(id) ON DELETE SET NULL,
  keyword TEXT,
  article_id UUID REFERENCES blog_articles(id) ON DELETE SET NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  word_count INTEGER,
  seo_score INTEGER,
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_created_at ON blog_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_status ON blog_generation_logs(status);

-- Enable RLS
ALTER TABLE blog_generation_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view all logs
CREATE POLICY "Admins can view generation logs" ON blog_generation_logs
  FOR SELECT USING (is_admin_user());

-- System can insert logs
CREATE POLICY "System can insert logs" ON blog_generation_logs
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);