-- Supprimer l'entrée hero_background_image devenue inutile (on utilise maintenant une image importée)
DELETE FROM site_content WHERE content_key = 'hero_background_image';
