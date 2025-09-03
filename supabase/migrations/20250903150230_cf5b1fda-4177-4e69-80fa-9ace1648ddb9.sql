-- Add SELECT policy for admins to view all messages
CREATE POLICY "Admins can view all messages" 
ON public.group_messages 
FOR SELECT 
USING (is_admin_user());