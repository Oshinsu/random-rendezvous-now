-- Phase 1: Fix immédiat - Remplacer l'URL locale manquante par une URL Unsplash optimisée
UPDATE site_content
SET content_value = '"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=85&fm=webp"'::jsonb
WHERE content_key = 'hero_background_image_url';