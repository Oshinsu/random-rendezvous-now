-- Phase 3: Update site_content with Supabase Storage URLs

-- Update all image URLs to point to Supabase Storage bucket
UPDATE site_content
SET 
  content_value = CASE content_key
    -- Hero section background
    WHEN 'hero_background_image' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/hero-banner.jpg"'::jsonb
    
    -- Benefits section images
    WHEN 'benefit_1_image_url' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/benefit-1.jpg"'::jsonb
    WHEN 'benefit_2_image_url' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/benefit-2.jpg"'::jsonb
    WHEN 'benefit_3_image_url' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/benefit-3.jpg"'::jsonb
    WHEN 'benefit_4_image_url' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/benefit-4.jpg"'::jsonb
    
    -- How it works section images
    WHEN 'step_1_image_complete' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/step-1.png"'::jsonb
    WHEN 'step_2_image_complete' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/step-2.png"'::jsonb
    WHEN 'step_3_image_complete' THEN 
      '"https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/step-3.png"'::jsonb
  END,
  updated_at = NOW()
WHERE content_key IN (
  'hero_background_image',
  'benefit_1_image_url', 
  'benefit_2_image_url', 
  'benefit_3_image_url', 
  'benefit_4_image_url',
  'step_1_image_complete', 
  'step_2_image_complete', 
  'step_3_image_complete'
);