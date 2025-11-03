-- Phase 2 & 4: Blog automation function + Storage bucket for images (NO CRON)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create storage bucket for blog images (Phase 4)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy for service_role uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow service_role to upload blog images'
  ) THEN
    CREATE POLICY "Allow service_role to upload blog images"
    ON storage.objects
    FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'blog-images');
  END IF;
END $$;

-- Storage RLS policy for public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view blog images'
  ) THEN
    CREATE POLICY "Public can view blog images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'blog-images');
  END IF;
END $$;

-- Function to trigger blog generation (Phase 2)
CREATE OR REPLACE FUNCTION trigger_blog_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schedule_record RECORD;
  function_url TEXT;
BEGIN
  -- Check if auto-generation is active
  SELECT * INTO schedule_record
  FROM blog_generation_schedule
  WHERE is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Auto-generation is disabled';
    RETURN;
  END IF;
  
  -- Check if it's time to generate
  IF schedule_record.next_generation_at IS NULL 
     OR schedule_record.next_generation_at <= NOW() THEN
    
    -- Build the edge function URL
    function_url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/generate-seo-article';
    
    -- Call edge function via pg_net
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    
    RAISE NOTICE 'Blog generation triggered at %', NOW();
  END IF;
END;
$$;

COMMENT ON FUNCTION trigger_blog_generation() IS 'Triggers automated blog article generation via edge function';
