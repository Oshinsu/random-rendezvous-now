-- ============================================
-- TABLES POUR SYSTÈME DE NOTIFICATIONS AVANCÉ
-- ============================================

-- Table pour stocker les tokens FCM/Push des utilisateurs
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'web', 'ios', 'android'
  device_name TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_user_push_tokens_user ON public.user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_active ON public.user_push_tokens(user_id, last_used_at);

-- Table pour stocker l'historique des notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'group_confirmed', 'bar_assigned', 'new_message', 'group_full', 'group_reminder', 'system'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  image TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, created_at) WHERE read_at IS NULL;
CREATE INDEX idx_user_notifications_type ON public.user_notifications(type, created_at);

-- Table pour analytics des notifications
CREATE TABLE IF NOT EXISTS public.notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.user_notifications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'dismissed'
  device_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_analytics_notification ON public.notification_analytics(notification_id);
CREATE INDEX idx_notification_analytics_event ON public.notification_analytics(event_type, created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour user_push_tokens
CREATE POLICY "Users can manage their own tokens"
  ON public.user_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.user_notifications
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can view all notifications"
  ON public.user_notifications
  FOR SELECT
  USING (is_admin_user());

-- Policies pour notification_analytics
CREATE POLICY "System can manage analytics"
  ON public.notification_analytics
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can view analytics"
  ON public.notification_analytics
  FOR SELECT
  USING (is_admin_user());

-- ============================================
-- TRIGGERS POUR NOTIFICATIONS AUTOMATIQUES
-- ============================================

-- Fonction pour créer une notification in-app
CREATE OR REPLACE FUNCTION public.create_in_app_notification(
  target_user_id UUID,
  notif_type TEXT,
  notif_title TEXT,
  notif_body TEXT,
  notif_data JSONB DEFAULT '{}'::jsonb,
  notif_action_url TEXT DEFAULT NULL,
  notif_icon TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.user_notifications (
    user_id,
    type,
    title,
    body,
    data,
    action_url,
    icon
  ) VALUES (
    target_user_id,
    notif_type,
    notif_title,
    notif_body,
    notif_data,
    notif_action_url,
    notif_icon
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger : Notification quand bar assigné
CREATE OR REPLACE FUNCTION public.notify_bar_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_record RECORD;
BEGIN
  -- Vérifier si le groupe passe à 'confirmed' ET a un bar assigné
  IF (OLD.status IS NULL OR OLD.status != 'confirmed') 
     AND NEW.status = 'confirmed' 
     AND NEW.bar_name IS NOT NULL THEN
    
    -- Créer notification pour chaque participant
    FOR participant_record IN 
      SELECT gp.user_id
      FROM public.group_participants gp
      WHERE gp.group_id = NEW.id 
        AND gp.status = 'confirmed'
    LOOP
      PERFORM public.create_in_app_notification(
        participant_record.user_id,
        'bar_assigned',
        '🎉 Bar assigné !',
        format('Rendez-vous au %s à %s', NEW.bar_name, to_char(NEW.meeting_time, 'HH24:MI')),
        json_build_object(
          'group_id', NEW.id,
          'bar_name', NEW.bar_name,
          'bar_address', NEW.bar_address,
          'meeting_time', NEW.meeting_time
        )::jsonb,
        format('/groups?group_id=%s', NEW.id),
        'https://api.iconify.design/mdi:glass-cocktail.svg'
      );
    END LOOP;
    
    RAISE NOTICE 'Created bar assignment notifications for group %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_bar_assigned
AFTER UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.notify_bar_assigned();

-- Trigger : Notification quand groupe devient plein
CREATE OR REPLACE FUNCTION public.notify_group_full()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_record RECORD;
BEGIN
  -- Vérifier si le groupe vient d'atteindre max_participants
  IF NEW.current_participants = NEW.max_participants 
     AND (OLD.current_participants IS NULL OR OLD.current_participants < NEW.max_participants) THEN
    
    FOR participant_record IN 
      SELECT gp.user_id
      FROM public.group_participants gp
      WHERE gp.group_id = NEW.id 
        AND gp.status = 'confirmed'
    LOOP
      PERFORM public.create_in_app_notification(
        participant_record.user_id,
        'group_full',
        '✅ Groupe complet !',
        format('Votre groupe de %s personnes est complet. Assignation du bar en cours...', NEW.max_participants),
        json_build_object('group_id', NEW.id)::jsonb,
        format('/groups?group_id=%s', NEW.id),
        'https://api.iconify.design/mdi:account-group.svg'
      );
    END LOOP;
    
    RAISE NOTICE 'Created group full notifications for group %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_group_full
AFTER UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.notify_group_full();

-- Trigger : Notification sur nouveau message groupe
CREATE OR REPLACE FUNCTION public.notify_new_group_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_record RECORD;
  sender_name TEXT;
BEGIN
  -- Ne pas notifier pour les messages système
  IF NEW.is_system THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le nom de l'expéditeur
  SELECT COALESCE(p.first_name || ' ' || p.last_name, 'Quelqu''un')
  INTO sender_name
  FROM public.profiles p
  WHERE p.id = NEW.user_id;
  
  -- Notifier tous les participants SAUF l'expéditeur
  FOR participant_record IN 
    SELECT gp.user_id
    FROM public.group_participants gp
    WHERE gp.group_id = NEW.group_id 
      AND gp.status = 'confirmed'
      AND gp.user_id != NEW.user_id
  LOOP
    PERFORM public.create_in_app_notification(
      participant_record.user_id,
      'new_message',
      format('💬 %s', sender_name),
      SUBSTRING(NEW.message, 1, 100),
      json_build_object(
        'group_id', NEW.group_id,
        'message_id', NEW.id,
        'sender_id', NEW.user_id
      )::jsonb,
      format('/groups?group_id=%s', NEW.group_id),
      'https://api.iconify.design/mdi:message-text.svg'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_group_message
AFTER INSERT ON public.group_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_group_message();