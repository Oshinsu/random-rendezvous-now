-- Add RLS policy to allow admins to update groups
CREATE POLICY "Admins can update all groups" 
ON public.groups 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Ensure the admin user has the correct role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'garybyss972@gmail.com'),
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;