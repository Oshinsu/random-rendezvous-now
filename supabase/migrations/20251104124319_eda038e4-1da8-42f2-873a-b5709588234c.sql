-- Add missing how_it_works step content keys
INSERT INTO site_content (content_key, content_type, content_value, page_section, description) VALUES 
('how_it_works_step_1_title', 'text', '"Tu cliques"', 'how_it_works', 'Titre étape 1'),
('how_it_works_step_1_description', 'text', '"Un simple clic et Random s''occupe de tout."', 'how_it_works', 'Description étape 1'),
('how_it_works_step_2_title', 'text', '"On matche un groupe"', 'how_it_works', 'Titre étape 2'),
('how_it_works_step_2_description', 'text', '"Notre algorithme crée un groupe équilibré de 4-5 personnes."', 'how_it_works', 'Description étape 2'),
('how_it_works_step_3_title', 'text', '"On trouve le bar parfait"', 'how_it_works', 'Titre étape 3'),
('how_it_works_step_3_description', 'text', '"Random sélectionne un bar cool, équidistant de tous."', 'how_it_works', 'Description étape 3'),
('how_it_works_step_4_title', 'text', '"Tu profites"', 'how_it_works', 'Titre étape 4'),
('how_it_works_step_4_description', 'text', '"Rendez-vous au bar et vis une soirée authentique."', 'how_it_works', 'Description étape 4')
ON CONFLICT (content_key) DO NOTHING;