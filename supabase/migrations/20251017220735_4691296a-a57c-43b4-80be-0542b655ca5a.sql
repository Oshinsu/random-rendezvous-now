-- Fix RLS policy to allow PostgreSQL triggers to insert system messages
-- The trigger runs in a database context where auth.uid() is NULL
-- This was blocking AUTO_BAR_ASSIGNMENT_TRIGGER message creation

DROP POLICY IF EXISTS system_can_send_messages_v2 ON public.group_messages;

CREATE POLICY system_can_send_messages_v2 ON public.group_messages
FOR INSERT
WITH CHECK (
    is_system = true
    AND (
        (auth.jwt() ->> 'role'::text) = 'service_role'::text  -- Edge functions
        OR auth.uid() IS NULL  -- PostgreSQL triggers
    )
);

-- Add comment explaining the policy
COMMENT ON POLICY system_can_send_messages_v2 ON public.group_messages IS 
'Allows system messages to be inserted by edge functions (service_role) or PostgreSQL triggers (auth.uid() is NULL)';