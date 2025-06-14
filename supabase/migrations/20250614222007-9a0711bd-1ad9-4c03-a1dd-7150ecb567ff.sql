
-- Créer la table pour les messages de groupe
CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_system BOOLEAN NOT NULL DEFAULT false
);

-- Activer Row Level Security
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des messages aux membres du groupe
CREATE POLICY "Group members can read messages" 
  ON public.group_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_id = group_messages.group_id 
      AND user_id = auth.uid()
      AND status = 'confirmed'
    )
  );

-- Politique pour permettre l'insertion de messages aux membres du groupe
CREATE POLICY "Group members can send messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_id = group_messages.group_id 
      AND user_id = auth.uid()
      AND status = 'confirmed'
    )
  );

-- Activer les mises à jour temps réel pour cette table
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;

-- Ajouter la table à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_group_messages_group_id_created_at ON public.group_messages(group_id, created_at);
