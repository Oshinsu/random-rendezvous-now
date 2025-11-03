-- SOTA 2025 Tables Migration (CORRECTED)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  messages JSONB DEFAULT '{}',
  context_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatbot_conversations_user ON chatbot_conversations(user_id);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_segments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (flag_key, flag_name, description, enabled, rollout_percentage) VALUES
  ('beta_chatbot', 'Chatbot Beta', 'Enable AI chatbot', TRUE, 100),
  ('new_cms_builder', 'New CMS Builder', 'Visual page builder', TRUE, 50)
ON CONFLICT (flag_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS structured_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  event TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_structured_logs_timestamp ON structured_logs(timestamp DESC);

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON chatbot_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all conversations" ON chatbot_conversations FOR ALL USING (is_admin_user());

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read flags" ON feature_flags FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage flags" ON feature_flags FOR ALL USING (is_admin_user());

ALTER TABLE structured_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON structured_logs FOR ALL USING (is_admin_user());

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage metrics" ON performance_metrics FOR ALL USING (is_admin_user());