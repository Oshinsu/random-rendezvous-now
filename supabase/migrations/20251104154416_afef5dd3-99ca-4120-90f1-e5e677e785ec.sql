-- PHASE 1: Nettoyage Hero Section
DELETE FROM site_content 
WHERE page_section = 'hero' 
AND content_key IN (
  'hero_title',
  'hero_title_main',
  'hero_title_secondary',
  'hero_subtitle_main',
  'hero_subtitle_secondary',
  'hero_cta_primary',
  'hero_cta_secondary',
  'hero_badge_beta',
  'hero_badge_evening',
  'hero_badge_paris'
);

-- PHASE 5: Nettoyage Benefits Section
DELETE FROM site_content 
WHERE page_section = 'benefits' 
AND content_key IN (
  'benefit_1_title',
  'benefit_1_description',
  'benefits_section_title',
  'benefits_section_subtitle'
);

-- PHASE 5: Nettoyage How It Works Section
DELETE FROM site_content 
WHERE page_section = 'how_it_works' 
AND content_key IN (
  'how_it_works_title',
  'step_1_title',
  'step_1_description',
  'step_1_title_complete',
  'step_1_description_complete',
  'step_1_icon_complete',
  'step_1_image_complete',
  'step_2_title',
  'step_2_description',
  'step_2_title_complete',
  'step_2_description_complete',
  'step_2_icon_complete',
  'step_2_image_complete',
  'step_3_title',
  'step_3_description',
  'step_3_title_complete',
  'step_3_description_complete',
  'step_3_icon_complete',
  'step_3_image_complete'
);

-- PHASE 5: Nettoyage Footer Section (garder social_* pour usage futur)
DELETE FROM site_content 
WHERE page_section = 'footer' 
AND content_key IN (
  'footer_main_description_new',
  'footer_tagline_new',
  'contact_address_new',
  'contact_phone_new'
);