-- Add DELETE policy for groups to allow users to delete their own groups
CREATE POLICY "Users can delete their own groups" 
ON public.groups 
FOR DELETE 
USING (auth.uid() = created_by_user_id AND status IN ('waiting', 'cancelled'));