-- Phase 1: Create Supabase Storage Bucket and RLS Policies for site-images

-- Create public bucket for site images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images', 
  'site-images', 
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS Policy: Public read access (everyone can view images)
CREATE POLICY "Public can view site images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-images');

-- RLS Policy: Only admins can upload images
CREATE POLICY "Only admins can upload site images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-images' 
  AND is_admin_user()
);

-- RLS Policy: Only admins can update images
CREATE POLICY "Only admins can update site images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-images' AND is_admin_user())
WITH CHECK (bucket_id = 'site-images' AND is_admin_user());

-- RLS Policy: Only admins can delete images
CREATE POLICY "Only admins can delete site images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-images' AND is_admin_user());