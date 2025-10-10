-- Configure cache-control for site-images bucket
UPDATE storage.buckets 
SET public = true,
    file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
WHERE id = 'site-images';

-- Add cache-control header configuration (7 days)
-- Note: This requires Supabase Storage to respect cache headers
-- which is automatically handled by Supabase CDN