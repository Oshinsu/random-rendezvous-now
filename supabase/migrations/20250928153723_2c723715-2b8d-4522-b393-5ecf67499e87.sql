-- Add PPU mode setting to system_settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('ppu_mode_enabled', 'false'::jsonb, 'Enable Pay-Per-Use mode for groups (0.99€ per member)'),
  ('ppu_price_cents', '99'::jsonb, 'PPU price in cents (default 0.99€)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create group_payments table to track payment sessions per group
CREATE TABLE public.group_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  stripe_session_id TEXT UNIQUE,
  total_amount_cents INTEGER NOT NULL DEFAULT 495, -- 5 * 99 cents
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payment_deadline TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT fk_group_payments_group FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE
);

-- Create member_payments table to track individual member payments
CREATE TABLE public.member_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_payment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 99,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  CONSTRAINT fk_member_payments_group_payment FOREIGN KEY (group_payment_id) REFERENCES public.group_payments(id) ON DELETE CASCADE,
  UNIQUE(group_payment_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.group_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_payments
CREATE POLICY "Group members can view their group payment"
  ON public.group_payments FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_participants 
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

CREATE POLICY "System can manage group payments"
  ON public.group_payments FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can view all group payments"
  ON public.group_payments FOR SELECT
  USING (is_admin_user());

-- RLS policies for member_payments  
CREATE POLICY "Users can view their own member payments"
  ON public.member_payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage member payments"
  ON public.member_payments FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can view all member payments"
  ON public.member_payments FOR SELECT  
  USING (is_admin_user());

-- Add indexes for performance
CREATE INDEX idx_group_payments_group_id ON public.group_payments(group_id);
CREATE INDEX idx_group_payments_status ON public.group_payments(status);
CREATE INDEX idx_member_payments_user_id ON public.member_payments(user_id);
CREATE INDEX idx_member_payments_group_payment_id ON public.member_payments(group_payment_id);

-- Function to check if PPU mode is enabled
CREATE OR REPLACE FUNCTION public.is_ppu_mode_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT (setting_value)::boolean FROM public.system_settings WHERE setting_key = 'ppu_mode_enabled'),
    false
  );
END;
$$;

-- Function to get PPU price in cents
CREATE OR REPLACE FUNCTION public.get_ppu_price_cents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT (setting_value)::integer FROM public.system_settings WHERE setting_key = 'ppu_price_cents'),
    99
  );
END;
$$;

-- Function to initiate group payment process
CREATE OR REPLACE FUNCTION public.initiate_group_payment(target_group_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_id UUID;
  member_count INTEGER;
  total_amount INTEGER;
  member_record RECORD;
BEGIN
  -- Check if PPU mode is enabled
  IF NOT public.is_ppu_mode_enabled() THEN
    RAISE EXCEPTION 'PPU mode is not enabled';
  END IF;
  
  -- Count confirmed members
  SELECT COUNT(*) INTO member_count
  FROM public.group_participants 
  WHERE group_id = target_group_id AND status = 'confirmed';
  
  IF member_count != 5 THEN
    RAISE EXCEPTION 'Group must have exactly 5 confirmed members';
  END IF;
  
  -- Calculate total amount
  total_amount := member_count * public.get_ppu_price_cents();
  
  -- Create group payment record
  INSERT INTO public.group_payments (group_id, total_amount_cents)
  VALUES (target_group_id, total_amount)
  RETURNING id INTO payment_id;
  
  -- Create member payment records
  FOR member_record IN 
    SELECT user_id FROM public.group_participants 
    WHERE group_id = target_group_id AND status = 'confirmed'
  LOOP
    INSERT INTO public.member_payments (group_payment_id, user_id, amount_cents)
    VALUES (payment_id, member_record.user_id, public.get_ppu_price_cents());
  END LOOP;
  
  RETURN payment_id;
END;
$$;

-- Function to check if all members have paid
CREATE OR REPLACE FUNCTION public.check_group_payment_completion(target_group_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_members INTEGER;
  paid_members INTEGER;
BEGIN
  -- Get the latest payment session for this group
  SELECT 
    COUNT(mp.*) as total,
    COUNT(CASE WHEN mp.status = 'paid' THEN 1 END) as paid
  INTO total_members, paid_members
  FROM public.group_payments gp
  JOIN public.member_payments mp ON gp.id = mp.group_payment_id
  WHERE gp.group_id = target_group_id
    AND gp.status IN ('pending', 'processing', 'completed')
  ORDER BY gp.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(total_members, 0) = COALESCE(paid_members, 0) AND total_members > 0;
END;
$$;