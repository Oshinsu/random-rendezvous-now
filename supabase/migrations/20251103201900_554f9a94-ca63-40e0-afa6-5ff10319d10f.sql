-- Create notification_types_config table
CREATE TABLE IF NOT EXISTS notification_types_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  type_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('groups', 'lifecycle', 'bars', 'messages', 'promotions')),
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Copy par défaut (JSON)
  default_copy JSONB NOT NULL DEFAULT '{"default": {"title": "", "body": ""}}',
  
  -- Règles d'envoi
  send_rules JSONB DEFAULT '{"max_per_day": null, "quiet_hours_exempt": false, "requires_user_consent": false}',
  
  -- Métadonnées
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notif_types_active ON notification_types_config(is_active);
CREATE INDEX IF NOT EXISTS idx_notif_types_category ON notification_types_config(category);
CREATE INDEX IF NOT EXISTS idx_notif_types_key ON notification_types_config(type_key);

-- RLS Policies
ALTER TABLE notification_types_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage notification types" ON notification_types_config;
CREATE POLICY "Admins can manage notification types"
  ON notification_types_config
  FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "System can read notification types" ON notification_types_config;
CREATE POLICY "System can read notification types"
  ON notification_types_config
  FOR SELECT
  USING (true);

-- Peupler avec les types existants
INSERT INTO notification_types_config (type_key, display_name, category, default_copy, description, priority) VALUES
  ('GROUP_FORMING', 'Groupe en formation', 'groups', '{"last_spot": {"title": "🔥 Dernière place disponible !", "body": "Ton groupe attend juste toi pour partir — fonce ! ⚡"}}', 'Notif envoyée quand un groupe se remplit', 8),
  ('GROUP_CONFIRMED', 'Groupe confirmé', 'groups', '{"default": {"title": "🎉 C''est parti ! Groupe confirmé", "body": "RDV au {{bar_name}} {{time}} — On se voit là-bas 🍹✨"}}', 'Notif envoyée quand 5 personnes ont rejoint', 10),
  ('WELCOME_FUN', 'Bienvenue', 'lifecycle', '{"default": {"title": "Bienvenue dans la Random fam ! 🎲✨", "body": "Salut {{first_name}}, t''es prêt·e pour ta première aventure ?"}}', 'Notif J0 après inscription', 9),
  ('FIRST_WIN', 'Première sortie', 'lifecycle', '{"celebration": {"title": "🎊 GG ! T''as déblocqué : Aventurier·e", "body": "Ta première sortie était ouf ?"}}', 'Notif après 1ère sortie confirmée', 8),
  ('PEAK_HOURS_FOMO', 'FOMO heures de pointe', 'lifecycle', '{"active_groups": {"title": "🔥 {{active_count}} groupes actifs RN !", "body": "C''est le moment parfait !"}}', 'Notif jeudi-samedi 18h-20h', 7),
  ('COMEBACK_COOL', 'Retour inactif', 'lifecycle', '{"new_spots": {"title": "Yo {{first_name}}, ça fait un bail ! 👋", "body": "Des nouveaux spots ont drop"}}', 'Notif J14 inactif', 6),
  ('NEW_BAR_NEARBY', 'Nouveau bar', 'bars', '{"discovery": {"title": "🆕 Nouveau bar près de toi !", "body": "{{bar_name}} vient de rejoindre Random"}}', 'Notif quand bar proche s''inscrit', 5),
  ('BAR_RATING', 'Note le bar', 'bars', '{"feedback": {"title": "Comment c''était le {{bar_name}} ? ⭐", "body": "Note en 10 secondes"}}', 'Notif post-sortie pour rating', 6),
  ('MEETING_REMINDER', 'Rappel RDV', 'groups', '{"soon": {"title": "🕐 Ton groupe c''est dans 30 min !", "body": "Prépare-toi !"}}', 'Notif 30 min avant la sortie', 9),
  ('STREAK_BUILDER', 'Streak de sorties', 'lifecycle', '{"two_outings": {"title": "🔥 T''es lancé·e !", "body": "{{count}} sorties"}}', 'Notif après 2-3 sorties', 5),
  ('REFERRAL_UNLOCK', 'Déblocage parrainage', 'lifecycle', '{"ambassador": {"title": "🎁 T''as déblocqué : Ambassadeur·ice !", "body": "Invite 3 potes"}}', 'Notif après 5 sorties', 5),
  ('WAITING_REMINDER', 'Rappel attente', 'groups', '{"default": {"title": "⏰ Ton groupe se cherche encore", "body": "{{count}}/5"}}', 'Notif si groupe bloqué longtemps', 7),
  ('TIMEOUT_WARNING', 'Avertissement expiration', 'groups', '{"urgent": {"title": "⚠️ Plus que {{minutes}} min !", "body": "Partage pour sauver ton groupe"}}', 'Notif avant expiration groupe', 8),
  ('ABANDONED_GROUP', 'Groupe abandonné', 'groups', '{"reminder": {"title": "T''as oublié ton groupe ? 🤔", "body": "Reviens vite"}}', 'Notif si user quitte groupe', 6),
  ('GROUP_FULL_SOON', 'Groupe presque complet', 'groups', '{"almost_there": {"title": "🎯 Presque complet !", "body": "Plus qu''1 personne"}}', 'Notif à 4/5 participants', 7),
  ('PAYMENT_REQUIRED', 'Paiement requis', 'groups', '{"urgent": {"title": "💳 Valide ton paiement", "body": "Finis en 2 clics"}}', 'Notif si PPU activé et non payé', 9),
  ('SPECIAL_EVENT', 'Événement spécial', 'promotions', '{"announcement": {"title": "🎉 {{event_title}}", "body": "{{event_description}}"}}', 'Notif pour annonces spéciales', 4)
ON CONFLICT (type_key) DO NOTHING;