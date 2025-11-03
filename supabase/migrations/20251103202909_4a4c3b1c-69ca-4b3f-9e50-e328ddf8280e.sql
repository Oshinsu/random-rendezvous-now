-- Table pour tracker les test sends
CREATE TABLE IF NOT EXISTS notification_test_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivery_status TEXT,
  error_message TEXT
);

-- Index
CREATE INDEX idx_test_sends_type ON notification_test_sends(notification_type);
CREATE INDEX idx_test_sends_sent_at ON notification_test_sends(sent_at DESC);

-- RLS
ALTER TABLE notification_test_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view test sends"
  ON notification_test_sends
  FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Admins can insert test sends"
  ON notification_test_sends
  FOR INSERT
  WITH CHECK (is_admin_user());

-- Storage bucket pour notification images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notification_images', 'notification_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload notification images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'notification_images' AND is_admin_user());

CREATE POLICY "Public can view notification images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'notification_images');