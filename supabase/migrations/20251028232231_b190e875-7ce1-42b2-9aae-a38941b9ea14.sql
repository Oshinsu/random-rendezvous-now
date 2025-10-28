-- Ajouter un segment pour les utilisateurs qui se connectent hors horaires de pointe
INSERT INTO public.crm_user_segments (segment_key, segment_name, description, criteria, color)
VALUES (
  'off_peak_users',
  '🕐 Horaires Inadaptés',
  'Utilisateurs qui se connectent principalement hors des horaires de forte affluence (18h-22h)',
  jsonb_build_object(
    'off_peak_ratio_min', 70,
    'description', 'Plus de 70% des connexions hors 18h-22h'
  ),
  '#f59e0b'
)
ON CONFLICT (segment_key) DO UPDATE SET
  segment_name = EXCLUDED.segment_name,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria,
  color = EXCLUDED.color;