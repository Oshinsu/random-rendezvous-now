-- Nettoyage des entrées obsolètes de site_content
DELETE FROM public.site_content 
WHERE content_key IN ('benefit_1_image', 'site_og_image_new');

-- Mettre à jour hero_background_image pour pointer vers la nouvelle image
UPDATE public.site_content 
SET content_value = '"/src/assets/new-hero-banner.jpg"'
WHERE content_key = 'hero_background_image';

-- Si hero_background_image n'existe pas, le créer
INSERT INTO public.site_content (
  content_key, 
  content_type, 
  content_value, 
  page_section, 
  description
) 
SELECT 
  'hero_background_image',
  'image',
  '"/src/assets/new-hero-banner.jpg"',
  'hero',
  'Image de fond de la section hero'
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE content_key = 'hero_background_image'
);