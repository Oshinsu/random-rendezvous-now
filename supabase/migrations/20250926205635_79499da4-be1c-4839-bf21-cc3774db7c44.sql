-- Créer la fonction update_updated_at_column si elle n'existe pas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table pour la gestion du contenu dynamique
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'json', 'html')),
  content_value JSONB NOT NULL,
  page_section TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Anyone can view site content" 
ON public.site_content 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage site content" 
ON public.site_content 
FOR ALL 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Trigger pour updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les contenus par défaut
INSERT INTO public.site_content (content_key, content_type, content_value, page_section, description) VALUES
-- Hero Section
('hero_title', 'text', '"Découvrez Random"', 'hero', 'Titre principal de la section hero'),
('hero_subtitle', 'text', '"Rencontrez des personnes incroyables autour d''un verre"', 'hero', 'Sous-titre de la section hero'),
('hero_cta_button', 'text', '"Rejoindre Random"', 'hero', 'Texte du bouton CTA principal'),
('hero_background_image', 'image', '"/src/assets/hero-banner.jpg"', 'hero', 'Image de fond de la section hero'),

-- Benefits Section  
('benefits_title', 'text', '"Pourquoi choisir Random ?"', 'benefits', 'Titre de la section avantages'),
('benefits_subtitle', 'text', '"Découvrez tous les avantages de notre plateforme"', 'benefits', 'Sous-titre de la section avantages'),
('benefit_1_title', 'text', '"Rencontres authentiques"', 'benefits', 'Titre du premier avantage'),
('benefit_1_description', 'text', '"Connectez-vous avec des personnes partageant vos centres d''intérêt"', 'benefits', 'Description du premier avantage'),
('benefit_1_image', 'image', '"/src/assets/benefit-1.jpg"', 'benefits', 'Image du premier avantage'),

-- How it works
('how_it_works_title', 'text', '"Comment ça marche ?"', 'how_it_works', 'Titre de la section comment ça marche'),
('step_1_title', 'text', '"Créez votre groupe"', 'how_it_works', 'Titre de l''étape 1'),
('step_1_description', 'text', '"Lancez un groupe dans votre zone"', 'how_it_works', 'Description de l''étape 1'),

-- Footer
('footer_description', 'text', '"Random - L''application qui révolutionne vos sorties"', 'footer', 'Description dans le footer'),
('contact_email', 'text', '"contact@random-app.fr"', 'footer', 'Email de contact'),

-- Meta données
('site_title', 'text', '"Random - Rencontrez des gens autour d''un verre"', 'meta', 'Titre du site'),
('site_description', 'text', '"Découvrez Random, l''application qui vous permet de rencontrer des personnes incroyables autour d''un verre dans votre ville."', 'meta', 'Description meta du site');