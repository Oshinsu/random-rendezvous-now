-- Phase 1: Corriger les politiques RLS sur crm_referrals
CREATE POLICY "Users can create their own referral codes"
ON public.crm_referrals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = referrer_user_id);

CREATE POLICY "Users can apply referral codes"
ON public.crm_referrals
FOR UPDATE
TO authenticated
USING (status = 'pending' AND referred_user_id IS NULL)
WITH CHECK (auth.uid() = referred_user_id AND status = 'converted');

-- Phase 2: Créer le système de crédits
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_available INTEGER GENERATED ALWAYS AS (total_credits - credits_used) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'refund')),
  source TEXT NOT NULL CHECK (source IN ('referral_reward', 'outing_payment', 'admin_grant', 'refund')),
  referral_id UUID REFERENCES public.crm_referrals(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_id ON public.user_credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_referral ON public.user_credit_transactions(referral_id);

-- RLS pour user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage credits"
ON public.user_credits
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'service_role');

-- RLS pour user_credit_transactions
ALTER TABLE public.user_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.user_credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.user_credit_transactions
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage transactions"
ON public.user_credit_transactions
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'service_role');

-- Phase 3: Fonction RPC pour ajouter des crédits
CREATE OR REPLACE FUNCTION public.add_user_credits(
  target_user_id UUID,
  amount INTEGER,
  transaction_type TEXT,
  source TEXT,
  referral_id UUID DEFAULT NULL,
  group_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, total_credits)
  VALUES (target_user_id, amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_credits = user_credits.total_credits + amount,
    updated_at = now();

  INSERT INTO public.user_credit_transactions (
    user_id, amount, transaction_type, source, referral_id, group_id
  ) VALUES (
    target_user_id, amount, transaction_type, source, referral_id, group_id
  );
END;
$$;

-- Phase 4: Trigger pour attribution automatique des crédits
CREATE OR REPLACE FUNCTION public.trigger_referral_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  outing_record RECORD;
BEGIN
  FOR outing_record IN 
    SELECT DISTINCT user_id 
    FROM public.user_outings_history 
    WHERE group_id = NEW.id
  LOOP
    PERFORM net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/award-referral-credits',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::json->>'authorization'
      ),
      body := json_build_object(
        'user_id', outing_record.user_id,
        'group_id', NEW.id
      )::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_referral_credits_on_completion
  AFTER UPDATE OF status ON public.groups
  FOR EACH ROW
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.trigger_referral_credits();