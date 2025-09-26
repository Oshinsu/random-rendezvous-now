-- Ajouter/mettre à jour les contenus avec gestion des doublons
INSERT INTO public.site_content (content_key, content_type, content_value, page_section, description) VALUES

-- Hero Section complète
('hero_title_main', 'text', '"Découvrez Random"', 'hero', 'Titre principal de la page d''accueil'),
('hero_title_secondary', 'text', '"L''aventure commence ici"', 'hero', 'Titre secondaire accrocheur'),
('hero_subtitle_main', 'text', '"Rencontrez des personnes incroyables autour d''un verre dans votre ville"', 'hero', 'Sous-titre principal détaillé'),
('hero_subtitle_secondary', 'text', '"En un clic, créez votre groupe et découvrez les meilleurs bars"', 'hero', 'Sous-titre secondaire'),
('hero_cta_primary', 'text', '"Commencer l''aventure"', 'hero', 'Bouton d''action principal'),
('hero_cta_secondary', 'text', '"En savoir plus"', 'hero', 'Bouton d''action secondaire'),
('hero_badge_beta', 'text', '"🚀 Version Beta"', 'hero', 'Badge statut beta'),
('hero_badge_evening', 'text', '"🌆 Disponible le soir"', 'hero', 'Badge disponibilité'),
('hero_badge_paris', 'text', '"📍 Paris & région parisienne"', 'hero', 'Badge géolocalisation'),

-- Section Avantages complète (avec nouveaux noms pour éviter les conflits)
('benefits_main_title', 'text', '"Pourquoi choisir Random ?"', 'benefits', 'Titre principal des avantages'),
('benefits_main_subtitle', 'text', '"Découvrez tous les avantages de rejoindre notre communauté"', 'benefits', 'Sous-titre des avantages'),
('benefit_1_title_new', 'text', '"Rencontres Authentiques"', 'benefits', 'Titre du premier avantage'),
('benefit_1_description_new', 'text', '"Connectez-vous avec des personnes qui partagent vos centres d''intérêt dans une ambiance décontractée"', 'benefits', 'Description du premier avantage'),
('benefit_1_icon_new', 'text', '"🤝"', 'benefits', 'Icône du premier avantage'),
('benefit_2_title_new', 'text', '"Découverte de Lieux"', 'benefits', 'Titre du deuxième avantage'),
('benefit_2_description_new', 'text', '"Explorez les meilleurs bars et lieux branchés de votre ville sélectionnés spécialement pour vous"', 'benefits', 'Description du deuxième avantage'),
('benefit_2_icon_new', 'text', '"🍹"', 'benefits', 'Icône du deuxième avantage'),
('benefit_3_title_new', 'text', '"Simplicité Totale"', 'benefits', 'Titre du troisième avantage'),
('benefit_3_description_new', 'text', '"En quelques clics, rejoignez un groupe et laissez-nous nous occuper du reste"', 'benefits', 'Description du troisième avantage'),
('benefit_3_icon_new', 'text', '"⚡"', 'benefits', 'Icône du troisième avantage'),
('benefit_4_title_new', 'text', '"Sécurité Garantie"', 'benefits', 'Titre du quatrième avantage'),
('benefit_4_description_new', 'text', '"Tous nos membres sont vérifiés pour garantir des rencontres en toute sécurité"', 'benefits', 'Description du quatrième avantage'),
('benefit_4_icon_new', 'text', '"🛡️"', 'benefits', 'Icône du quatrième avantage'),

-- Images des avantages
('benefit_1_image_url', 'image', '"/src/assets/new-benefit-1.jpg"', 'benefits', 'Image illustrant les rencontres authentiques'),
('benefit_2_image_url', 'image', '"/src/assets/new-benefit-2.jpg"', 'benefits', 'Image illustrant la découverte de lieux'),
('benefit_3_image_url', 'image', '"/src/assets/new-benefit-3.jpg"', 'benefits', 'Image illustrant la simplicité'),
('benefit_4_image_url', 'image', '"/src/assets/new-benefit-4.jpg"', 'benefits', 'Image illustrant la sécurité'),

-- Section Comment ça marche complète
('how_it_works_main_title_new', 'text', '"Comment ça marche ?"', 'how_it_works', 'Titre principal de la section fonctionnement'),
('how_it_works_subtitle_new', 'text', '"Rejoindre Random est simple comme bonjour"', 'how_it_works', 'Sous-titre de la section fonctionnement'),
('step_1_title_complete', 'text', '"1. Créez votre profil"', 'how_it_works', 'Titre de la première étape'),
('step_1_description_complete', 'text', '"Inscrivez-vous gratuitement et complétez votre profil en quelques minutes"', 'how_it_works', 'Description de la première étape'),
('step_1_icon_complete', 'text', '"👤"', 'how_it_works', 'Icône de la première étape'),
('step_2_title_complete', 'text', '"2. Rejoignez un groupe"', 'how_it_works', 'Titre de la deuxième étape'),
('step_2_description_complete', 'text', '"Parcourez les groupes disponibles près de chez vous et rejoignez celui qui vous plaît"', 'how_it_works', 'Description de la deuxième étape'),
('step_2_icon_complete', 'text', '"👥"', 'how_it_works', 'Icône de la deuxième étape'),
('step_3_title_complete', 'text', '"3. Profitez de la soirée"', 'how_it_works', 'Titre de la troisième étape'),
('step_3_description_complete', 'text', '"Retrouvez votre groupe au bar assigné et passez une soirée inoubliable"', 'how_it_works', 'Description de la troisième étape'),
('step_3_icon_complete', 'text', '"🎉"', 'how_it_works', 'Icône de la troisième étape'),

-- Images des étapes
('step_1_image_complete', 'image', '"/src/assets/step-1.png"', 'how_it_works', 'Image illustrant la création de profil'),
('step_2_image_complete', 'image', '"/src/assets/step-2.png"', 'how_it_works', 'Image illustrant rejoindre un groupe'),
('step_3_image_complete', 'image', '"/src/assets/step-3.png"', 'how_it_works', 'Image illustrant profiter de la soirée'),

-- Footer complet
('footer_main_description_new', 'text', '"Random - L''application qui révolutionne vos sorties nocturnes à Paris"', 'footer', 'Description principale du footer'),
('footer_tagline_new', 'text', '"Osez l''imprévu, vivez l''authentique"', 'footer', 'Slogan du footer'),
('footer_copyright_new', 'text', '"© 2024 Random. Tous droits réservés."', 'footer', 'Copyright du footer'),
('footer_made_with_love', 'text', '"Fait avec ❤️ à Paris"', 'footer', 'Mention fait avec amour'),
('contact_phone_new', 'text', '"+33 1 23 45 67 89"', 'footer', 'Numéro de téléphone de contact'),
('contact_address_new', 'text', '"Paris, France"', 'footer', 'Adresse de contact'),
('social_instagram', 'text', '"https://instagram.com/randomapp"', 'footer', 'Lien Instagram'),
('social_twitter', 'text', '"https://twitter.com/randomapp"', 'footer', 'Lien Twitter'),
('social_facebook', 'text', '"https://facebook.com/randomapp"', 'footer', 'Lien Facebook'),

-- Navigation
('nav_logo_text', 'text', '"Random"', 'navigation', 'Texte du logo dans la navigation'),
('nav_menu_groups', 'text', '"Groupes"', 'navigation', 'Libellé menu Groupes'),
('nav_menu_scheduled', 'text', '"Programmés"', 'navigation', 'Libellé menu Programmés'),
('nav_menu_profile', 'text', '"Profil"', 'navigation', 'Libellé menu Profil'),
('nav_menu_about', 'text', '"À propos"', 'navigation', 'Libellé menu À propos'),
('nav_cta_login', 'text', '"Se connecter"', 'navigation', 'Bouton de connexion'),
('nav_cta_signup', 'text', '"S''inscrire"', 'navigation', 'Bouton d''inscription'),

-- Méta-données complètes
('site_title_home_new', 'text', '"Random - Rencontrez des gens autour d''un verre à Paris"', 'meta', 'Titre de la page d''accueil'),
('site_description_home_new', 'text', '"Découvrez Random, l''application qui vous permet de rencontrer facilement des personnes dans les meilleurs bars de Paris. Rejoignez un groupe et vivez des soirées inoubliables."', 'meta', 'Description de la page d''accueil'),
('site_keywords', 'text', '"rencontres, paris, bars, sorties, amis, social, random"', 'meta', 'Mots-clés du site'),
('site_author', 'text', '"Random Team"', 'meta', 'Auteur du site'),
('site_og_title', 'text', '"Random - L''app des rencontres authentiques"', 'meta', 'Titre Open Graph'),
('site_og_description', 'text', '"Rencontrez des personnes incroyables autour d''un verre. Simple, authentique, spontané."', 'meta', 'Description Open Graph'),
('site_og_image_new', 'image', '"/src/assets/hero-banner.jpg"', 'meta', 'Image Open Graph'),

-- Contenus d'erreur et messages
('error_404_title', 'text', '"Page non trouvée"', 'error', 'Titre de la page 404'),
('error_404_description', 'text', '"Oups ! La page que vous cherchez n''existe pas."', 'error', 'Description de la page 404'),
('error_500_title', 'text', '"Erreur serveur"', 'error', 'Titre de l''erreur 500'),
('error_500_description', 'text', '"Une erreur est survenue. Nos équipes travaillent à la résoudre."', 'error', 'Description de l''erreur 500'),
('loading_message', 'text', '"Chargement en cours..."', 'system', 'Message de chargement'),
('success_message', 'text', '"Action réalisée avec succès !"', 'system', 'Message de succès'),

-- Contenu auth/connexion
('auth_welcome_title', 'text', '"Bienvenue sur Random"', 'auth', 'Titre de bienvenue sur la page d''authentification'),
('auth_welcome_subtitle', 'text', '"Connectez-vous pour commencer votre aventure"', 'auth', 'Sous-titre de la page d''authentification'),
('auth_login_button', 'text', '"Se connecter"', 'auth', 'Bouton de connexion'),
('auth_signup_button', 'text', '"Créer un compte"', 'auth', 'Bouton de création de compte'),
('auth_forgot_password', 'text', '"Mot de passe oublié ?"', 'auth', 'Lien mot de passe oublié'),

-- Dashboard content
('dashboard_welcome_title', 'text', '"Bienvenue sur votre dashboard"', 'dashboard', 'Titre de bienvenue du dashboard'),
('dashboard_welcome_subtitle', 'text', '"Gérez vos groupes et découvrez de nouvelles opportunités"', 'dashboard', 'Sous-titre du dashboard'),
('dashboard_stats_groups', 'text', '"Groupes actifs"', 'dashboard', 'Libellé statistiques groupes'),
('dashboard_stats_outings', 'text', '"Sorties réalisées"', 'dashboard', 'Libellé statistiques sorties'),

-- Contenus JSON structurés
('site_theme_colors', 'json', '{"primary": "#dc2626", "secondary": "#f97316", "accent": "#059669"}', 'theme', 'Couleurs du thème du site'),
('api_endpoints', 'json', '{"groups": "/api/groups", "users": "/api/users", "auth": "/api/auth"}', 'technical', 'Points d''accès API'),
('feature_flags', 'json', '{"beta_mode": true, "maintenance_mode": false, "new_ui": true}', 'technical', 'Flags de fonctionnalités'),

-- Contenus supplémentaires pour enrichir le CMS
('pricing_title', 'text', '"Tarifs transparents"', 'pricing', 'Titre de la section tarifs'),
('pricing_subtitle', 'text', '"Choisissez l''offre qui vous correspond"', 'pricing', 'Sous-titre de la section tarifs'),
('testimonials_title', 'text', '"Ils nous font confiance"', 'testimonials', 'Titre de la section témoignages'),
('testimonials_subtitle', 'text', '"Découvrez les retours de notre communauté"', 'testimonials', 'Sous-titre de la section témoignages'),
('faq_title', 'text', '"Questions fréquentes"', 'faq', 'Titre de la section FAQ'),
('faq_subtitle', 'text', '"Trouvez rapidement les réponses à vos questions"', 'faq', 'Sous-titre de la section FAQ'),
('newsletter_title', 'text', '"Restez informé"', 'newsletter', 'Titre newsletter'),
('newsletter_subtitle', 'text', '"Recevez nos dernières nouvelles et conseils"', 'newsletter', 'Sous-titre newsletter'),
('newsletter_placeholder', 'text', '"Votre adresse email"', 'newsletter', 'Placeholder newsletter'),
('newsletter_button', 'text', '"S''abonner"', 'newsletter', 'Bouton newsletter')

ON CONFLICT (content_key) DO UPDATE SET
  content_value = EXCLUDED.content_value,
  description = EXCLUDED.description,
  updated_at = now();