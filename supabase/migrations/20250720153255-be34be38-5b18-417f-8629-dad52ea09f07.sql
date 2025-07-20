
-- Create bar_locks table for atomic bar reservation
CREATE TABLE public.bar_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_place_id TEXT NOT NULL,
  bar_name TEXT NOT NULL,
  bar_address TEXT NOT NULL,
  bar_latitude DOUBLE PRECISION NOT NULL,
  bar_longitude DOUBLE PRECISION NOT NULL,
  locked_by_group_id UUID NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent double-locking
CREATE UNIQUE INDEX idx_bar_locks_place_id_active ON public.bar_locks (bar_place_id) 
WHERE expires_at > now();

-- Add index for cleanup operations
CREATE INDEX idx_bar_locks_expires_at ON public.bar_locks (expires_at);

-- Enable RLS
ALTER TABLE public.bar_locks ENABLE ROW LEVEL SECURITY;

-- Policy for system operations
CREATE POLICY "system_can_manage_bar_locks" 
ON public.bar_locks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Policy for authenticated users to view locks (for debugging)
CREATE POLICY "authenticated_users_can_view_bar_locks" 
ON public.bar_locks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create enhanced automatic bar assignment function with locking
CREATE OR REPLACE FUNCTION public.enhanced_auto_assign_bar_with_lock(
  p_group_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
) RETURNS TABLE(
  success BOOLEAN,
  bar_place_id TEXT,
  bar_name TEXT,
  bar_address TEXT,
  bar_latitude DOUBLE PRECISION,
  bar_longitude DOUBLE PRECISION,
  error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_group_record RECORD;
  v_lock_record RECORD;
  v_meeting_time TIMESTAMP WITH TIME zone;
BEGIN
  -- Clean up expired locks first
  DELETE FROM public.bar_locks WHERE expires_at <= now();
  
  -- Validate group eligibility
  SELECT * INTO v_group_record
  FROM public.groups 
  WHERE id = p_group_id 
    AND status = 'confirmed' 
    AND current_participants = 5 
    AND bar_name IS NULL 
    AND bar_place_id IS NULL;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::DOUBLE PRECISION, NULL::DOUBLE PRECISION, 'Group not eligible for bar assignment'::TEXT;
    RETURN;
  END IF;
  
  -- Try to find and lock an available bar (this would be called from the Edge Function)
  -- For now, we'll return a placeholder that the Edge Function will handle
  RETURN QUERY SELECT true, 'EDGE_FUNCTION_HANDLE'::TEXT, NULL::TEXT, NULL::TEXT, p_latitude, p_longitude, NULL::TEXT;
END;
$$;

-- Create function to finalize bar assignment after successful lock
CREATE OR REPLACE FUNCTION public.finalize_bar_assignment(
  p_group_id UUID,
  p_bar_place_id TEXT,
  p_bar_name TEXT,
  p_bar_address TEXT,
  p_bar_latitude DOUBLE PRECISION,
  p_bar_longitude DOUBLE PRECISION
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_meeting_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate that we have a lock for this bar and group
  IF NOT EXISTS (
    SELECT 1 FROM public.bar_locks 
    WHERE bar_place_id = p_bar_place_id 
      AND locked_by_group_id = p_group_id 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'No valid lock found for bar assignment';
  END IF;
  
  -- Set meeting time (1 hour from now)
  v_meeting_time := now() + INTERVAL '1 hour';
  
  -- Update group with bar information
  UPDATE public.groups 
  SET 
    bar_name = p_bar_name,
    bar_address = p_bar_address,
    bar_latitude = p_bar_latitude,
    bar_longitude = p_bar_longitude,
    bar_place_id = p_bar_place_id,
    meeting_time = v_meeting_time
  WHERE id = p_group_id;
  
  -- Remove the lock (assignment completed)
  DELETE FROM public.bar_locks 
  WHERE bar_place_id = p_bar_place_id 
    AND locked_by_group_id = p_group_id;
  
  -- Add success message to group chat
  INSERT INTO public.group_messages (
    group_id,
    user_id,
    message,
    is_system
  ) VALUES (
    p_group_id,
    '00000000-0000-0000-0000-000000000000',
    FORMAT('🍺 Rendez-vous fixé au %s à %s !', p_bar_name, to_char(v_meeting_time, 'HH24:MI')),
    true
  );
  
  RETURN true;
END;
$$;

-- Create cleanup function for expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_bar_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  DELETE FROM public.bar_locks WHERE expires_at <= now();
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired bar locks', cleanup_count;
  RETURN cleanup_count;
END;
$$;
