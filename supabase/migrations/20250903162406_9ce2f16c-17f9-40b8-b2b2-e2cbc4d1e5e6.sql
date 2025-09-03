-- Create user email preferences table
CREATE TABLE public.user_email_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    group_notifications boolean NOT NULL DEFAULT true,
    scheduled_reminders boolean NOT NULL DEFAULT true,
    newsletter boolean NOT NULL DEFAULT true,
    marketing_emails boolean NOT NULL DEFAULT true,
    all_emails_disabled boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email preferences" 
ON public.user_email_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences" 
ON public.user_email_preferences 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences" 
ON public.user_email_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all email preferences" 
ON public.user_email_preferences 
FOR SELECT 
USING (is_admin_user());

-- Create function to delete user account and all related data
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    deleted_count integer := 0;
BEGIN
    -- Verify that the requesting user is deleting their own account
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'You can only delete your own account';
    END IF;
    
    -- Delete user's group participations
    DELETE FROM public.group_participants WHERE user_id = target_user_id;
    
    -- Delete user's group messages
    DELETE FROM public.group_messages WHERE user_id = target_user_id;
    
    -- Delete user's outings history
    DELETE FROM public.user_outings_history WHERE user_id = target_user_id;
    
    -- Delete user's email preferences
    DELETE FROM public.user_email_preferences WHERE user_id = target_user_id;
    
    -- Delete user's profile
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- Log the account deletion for audit purposes
    INSERT INTO public.admin_audit_log (
        admin_user_id,
        action_type,
        table_name,
        record_id,
        metadata
    ) VALUES (
        target_user_id,
        'DELETE_ACCOUNT',
        'profiles',
        target_user_id,
        json_build_object(
            'timestamp', now(),
            'self_deletion', true
        )
    );
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$$;